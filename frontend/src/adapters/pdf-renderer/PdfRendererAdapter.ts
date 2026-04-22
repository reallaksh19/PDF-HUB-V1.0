import {
  getDocument,
  GlobalWorkerOptions,
  Util,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { debug, error } from '@/core/logger/service';

GlobalWorkerOptions.workerSrc = workerSrc;

export interface RenderedPage {
  width: number;
  height: number;
  scale: number;
}

export interface TextLayerItem {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

export interface SearchHitRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextSearchHit {
  id: string;
  pageNumber: number;
  snippet: string;
  rects: SearchHitRect[];
}

export interface OutlineItem {
  id: string;
  title: string;
  pageNumber: number | null;
  depth: number;
}

function isTransformItem(
  value: unknown,
): value is { str: string; transform: number[]; width: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'str' in value &&
    typeof (value as { str: unknown }).str === 'string' &&
    'transform' in value &&
    Array.isArray((value as { transform: unknown }).transform)
  );
}

export class PdfRendererAdapter {
  static async loadDocument(buffer: Uint8Array | ArrayBuffer): Promise<PDFDocumentProxy> {
    try {
      // PDF.js may transfer typed-array buffers to the worker, which detaches them.
      // Clone input bytes so shared session state remains readable across reloads.
      const data =
        buffer instanceof Uint8Array
          ? new Uint8Array(buffer)
          : buffer.slice(0);

      const task = getDocument({ data });
      return await task.promise;
    } catch (err) {
      error('pdf-renderer', 'Failed to load document', { error: String(err) });
      throw err;
    }
  }

  static async renderPage(
    page: PDFPageProxy,
    scale: number,
    canvas: HTMLCanvasElement,
  ): Promise<RenderedPage> {
    const startTime = performance.now();
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('2D canvas context is not available');
    }

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

    const renderTask = page.render({
      canvas,
      canvasContext: context,
      viewport,
      transform,
    });

    try {
      await renderTask.promise;
      debug('pdf-renderer', 'Page rendered', {
        pageNumber: page.pageNumber,
        renderTimeMs: Math.round(performance.now() - startTime),
      });
      return { width: viewport.width, height: viewport.height, scale };
    } catch (err) {
      error('pdf-renderer', 'Failed to render page', {
        pageNumber: page.pageNumber,
        error: String(err),
      });
      throw err;
    }
  }

  static async getPageTextItems(
    page: PDFPageProxy,
    scale: number,
  ): Promise<TextLayerItem[]> {
    try {
      const viewport = page.getViewport({ scale });
      const textContent = await page.getTextContent();

      return textContent.items.flatMap((item, index) => {
        if (!isTransformItem(item)) {
          return [];
        }

        const tx = Util.transform(viewport.transform, item.transform);
        const fontSize = Math.hypot(tx[2], tx[3]);
        const width = Math.max(4, item.width * scale);
        const height = Math.max(8, fontSize);

        return [
          {
            id: `page-${page.pageNumber}-text-${index}`,
            text: item.str,
            x: tx[4],
            y: tx[5] - height,
            width,
            height,
            fontSize,
          },
        ];
      });
    } catch (err) {
      error('pdf-renderer', 'Failed to build text layer', {
        pageNumber: page.pageNumber,
        error: String(err),
      });
      return [];
    }
  }

  static async getThumbnail(page: PDFPageProxy): Promise<string> {
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = 150 / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(scaledViewport.width);
    canvas.height = Math.floor(scaledViewport.height);

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('2D canvas context is not available for thumbnail');
    }

    await page.render({
      canvas,
      canvasContext: context,
      viewport: scaledViewport,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.8);
  }

  static async getPagePlainText(page: PDFPageProxy): Promise<string> {
    try {
      const textContent = await page.getTextContent();
      const chunks = textContent.items.map((item) => {
        if ('str' in item && typeof item.str === 'string') {
          return item.str;
        }
        return '';
      });
      return chunks.join(' ').replace(/\s+/g, ' ').trim();
    } catch (err) {
      error('pdf-renderer', 'Failed to read page text', {
        pageNumber: page.pageNumber,
        error: String(err),
      });
      return '';
    }
  }

  static async searchDocumentText(bytes: Uint8Array, query: string): Promise<TextSearchHit[]> {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    const doc = await this.loadDocument(bytes);
    try {
      const hits: TextSearchHit[] = [];

      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
        const page = await doc.getPage(pageNumber);
        const textItems = await this.getPageTextItems(page, 1.0);

        let fullText = "";
        const itemMap: { start: number; end: number; item: TextLayerItem }[] = [];

        for (const item of textItems) {
            const start = fullText.length;
            fullText += item.text + " ";
            itemMap.push({ start, end: fullText.length - 1, item }); // -1 for the space
        }

        let idx = fullText.toLowerCase().indexOf(normalizedQuery);
        let hitCount = 0;

        while (idx !== -1) {
            const matchEnd = idx + normalizedQuery.length;
            const hitItems = itemMap.filter(m => m.start < matchEnd && m.end > idx);

            const startSnippetIdx = Math.max(0, idx - 20);
            const endSnippetIdx = Math.min(fullText.length, matchEnd + 20);
            let snippet = fullText.substring(startSnippetIdx, endSnippetIdx);

            if (startSnippetIdx > 0) snippet = "..." + snippet;
            if (endSnippetIdx < fullText.length) snippet = snippet + "...";

            hits.push({
                id: `hit-${pageNumber}-${hitCount}`,
                pageNumber,
                snippet: snippet,
                rects: hitItems.map(m => ({ x: m.item.x, y: m.item.y, width: m.item.width, height: m.item.height }))
            });
            hitCount++;
            idx = fullText.toLowerCase().indexOf(normalizedQuery, idx + 1);
        }
      }

      return hits;
    } finally {
      await doc.destroy();
    }
  }

  static async getOutlineFlat(doc: PDFDocumentProxy): Promise<OutlineItem[]> {
    try {
      const outline = await doc.getOutline();
      if (!outline) {
        return [];
      }

      const flat: OutlineItem[] = [];
      let counter = 0;

      const walk = async (
        nodes: NonNullable<Awaited<ReturnType<PDFDocumentProxy['getOutline']>>>,
        depth: number,
      ): Promise<void> => {
        for (const node of nodes) {
          let pageNumber: number | null = null;
          try {
            let destinationRef: unknown = null;
            if (Array.isArray(node.dest)) {
              destinationRef = node.dest[0];
            } else if (typeof node.dest === 'string') {
              const destination = await doc.getDestination(node.dest);
              if (Array.isArray(destination)) {
                destinationRef = destination[0];
              }
            }

            if (destinationRef) {
              const pageIndex = await doc.getPageIndex(destinationRef as never);
              pageNumber = pageIndex + 1;
            }
          } catch {
            pageNumber = null;
          }

          flat.push({
            id: `outline-${counter}`,
            title: node.title || `Bookmark ${counter + 1}`,
            pageNumber,
            depth,
          });
          counter += 1;

          if (node.items && node.items.length > 0) {
            await walk(node.items, depth + 1);
          }
        }
      };

      await walk(outline, 0);
      return flat;
    } catch (err) {
      error('pdf-renderer', 'Failed to load document outline', { error: String(err) });
      return [];
    }
  }
}

