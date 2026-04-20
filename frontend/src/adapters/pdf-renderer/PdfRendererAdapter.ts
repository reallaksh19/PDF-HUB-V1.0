import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { debug, error } from '@/core/logger/service';
import type { TextBlock } from '@/core/ocr/types';
import type { RenderedPage } from './types';

// Set worker source (assumes it will be available in public/ or dist/)
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export class PdfRendererAdapter {
  static async loadDocument(buffer: ArrayBuffer): Promise<PDFDocumentProxy> {
    try {
      const task = pdfjsLib.getDocument({ data: buffer });
      const doc = await task.promise;
      return doc;
    } catch (err) {
      error('pdf-renderer', 'Failed to load document', { error: String(err) });
      throw err;
    }
  }

  static async renderPage(page: PDFPageProxy, scale: number, canvas: HTMLCanvasElement): Promise<RenderedPage> {
    const startTime = performance.now();
    const viewport = page.getViewport({ scale });
    
    // Support HiDPI-displays
    const outputScale = window.devicePixelRatio || 1;
    
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height =  Math.floor(viewport.height) + "px";
    
    const transform = outputScale !== 1 
      ? [outputScale, 0, 0, outputScale, 0, 0] 
      : undefined;

    const renderContext = {
      canvasContext: canvas.getContext('2d')!,
      canvas: canvas,
      transform,
      viewport: viewport
    };

    try {
      await page.render(renderContext).promise;
      const renderTimeMs = Math.round(performance.now() - startTime);
      
      debug('pdf-renderer', 'Page rendered', { 
        pageNumber: page.pageNumber, 
        renderTimeMs 
      });
      
      return { canvas, width: viewport.width, height: viewport.height, scale };
    } catch (err) {
      error('pdf-renderer', 'Failed to render page', { pageNumber: page.pageNumber, error: String(err) });
      throw err;
    }
  }

  static async getTextContent(page: PDFPageProxy): Promise<TextBlock[]> {
    try {
      const textContent = await page.getTextContent();
      // Using basic cast since pdfjs types can be slightly out of sync
      return textContent.items.map((item: import('pdfjs-dist/types/src/display/api').TextItem | import('pdfjs-dist/types/src/display/api').TextMarkedContent, index: number) => ({
        id: `text-${page.pageNumber}-${index}`,
        text: ('str' in item ? item.str : ''),
        // Calculate basic rect from transform matrix: [scaleX, skewY, skewX, scaleY, translateX, translateY]
        rect: {
          x: ('transform' in item ? item.transform[4] : 0),
          y: ('transform' in item ? item.transform[5] : 0) - ('height' in item ? item.height : 0), // PDF coordinates start bottom-left
          width: ('width' in item ? item.width : 0),
          height: ('height' in item ? item.height : 0)
        },
        confidence: 1.0,
        type: 'text'
      }));
    } catch (err) {
      error('pdf-renderer', 'Failed to extract text', { pageNumber: page.pageNumber, error: String(err) });
      throw err;
    }
  }

  static async getThumbnail(page: PDFPageProxy): Promise<string> {
    // 150px wide dataURL
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = 150 / viewport.width;
    const scaledViewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    
    const renderContext = {
      canvasContext: canvas.getContext('2d')!,
      canvas: canvas,
      viewport: scaledViewport
    };

    await page.render(renderContext).promise;
    return canvas.toDataURL('image/jpeg', 0.8);
  }
}
