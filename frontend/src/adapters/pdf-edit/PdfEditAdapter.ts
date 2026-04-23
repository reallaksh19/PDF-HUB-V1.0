import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import type { PDFPage } from 'pdf-lib';
import type { PdfAnnotation } from '@/core/annotations/types';

type HeaderFooterOptions = {
  pages: number[];
  zone: 'header' | 'footer';
  text: string;
  align: 'left' | 'center' | 'right';
  marginX: number;
  marginY: number;
  fontSize: number;
  color: string;
  opacity: number;
  fileName: string;
  now: Date;
  enablePageNumberToken: boolean;
  enableFileNameToken: boolean;
  enableDateToken: boolean;
};

function normalizePageIndices(pageIndices: number[]): number[] {
  return Array.from(new Set(pageIndices)).sort((a, b) => a - b);
}

function hexToRgb(hex: string): ReturnType<typeof rgb> {
  const normalized = hex.replace('#', '').trim();
  const safe =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized.padEnd(6, '0').slice(0, 6);

  const red = parseInt(safe.slice(0, 2), 16) / 255;
  const green = parseInt(safe.slice(2, 4), 16) / 255;
  const blue = parseInt(safe.slice(4, 6), 16) / 255;
  return rgb(red, green, blue);
}

function resolveHeaderFooterTokens(
  template: string,
  values: {
    page: number;
    pages: number;
    file: string;
    date: string;
    enablePageNumberToken: boolean;
    enableFileNameToken: boolean;
    enableDateToken: boolean;
  },
): string {
  let output = template;

  if (values.enablePageNumberToken) {
    output = output.replaceAll('{page}', String(values.page));
    output = output.replaceAll('{{page}}', String(values.page));
    output = output.replaceAll('{pages}', String(values.pages));
    output = output.replaceAll('{{total_pages}}', String(values.pages));
    output = output.replaceAll('{{pages}}', String(values.pages));
  }
  if (values.enableFileNameToken) {
    output = output.replaceAll('{file}', values.file);
    output = output.replaceAll('{{file_name}}', values.file);
    output = output.replaceAll('{{file}}', values.file);
  }
  if (values.enableDateToken) {
    output = output.replaceAll('{date}', values.date);
    output = output.replaceAll('{{date}}', values.date);
  }

  return output;
}

function drawArrowHead(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: ReturnType<typeof rgb>,
  thickness: number,
): void {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = Math.max(8, thickness * 4);

  const leftX = x2 - headLength * Math.cos(angle - Math.PI / 6);
  const leftY = y2 - headLength * Math.sin(angle - Math.PI / 6);
  const rightX = x2 - headLength * Math.cos(angle + Math.PI / 6);
  const rightY = y2 - headLength * Math.sin(angle + Math.PI / 6);

  page.drawLine({
    start: { x: x2, y: y2 },
    end: { x: leftX, y: leftY },
    thickness,
    color,
  });

  page.drawLine({
    start: { x: x2, y: y2 },
    end: { x: rightX, y: rightY },
    thickness,
    color,
  });
}

export class PdfEditAdapter {
  static async countPages(bytes: Uint8Array): Promise<number> {
    const pdfDoc = await PDFDocument.load(bytes);
    return pdfDoc.getPageCount();
  }

  static async getPageSize(
    bytes: Uint8Array,
    pageIndex: number,
  ): Promise<{ width: number; height: number }> {
    const pdfDoc = await PDFDocument.load(bytes);
    const page = pdfDoc.getPage(pageIndex);
    return { width: page.getWidth(), height: page.getHeight() };
  }

  static async merge(baseBytes: Uint8Array, appendDocs: Uint8Array[]): Promise<Uint8Array> {
    const out = await PDFDocument.load(baseBytes);

    for (const docBytes of appendDocs) {
      const src = await PDFDocument.load(docBytes);
      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach((page) => out.addPage(page));
    }

    return await out.save();
  }

  static async insertAt(baseBytes: Uint8Array, insertBytes: Uint8Array, atIndex: number): Promise<Uint8Array> {
    const baseDoc = await PDFDocument.load(baseBytes);
    const insertDoc = await PDFDocument.load(insertBytes);
    const copied = await baseDoc.copyPages(insertDoc, insertDoc.getPageIndices());

    let targetIndex = Math.max(0, Math.min(atIndex, baseDoc.getPageCount()));
    copied.forEach((page) => {
      baseDoc.insertPage(targetIndex, page);
      targetIndex += 1;
    });

    return await baseDoc.save();
  }

  static async insertBlankPage(
    baseBytes: Uint8Array,
    atIndex: number,
    size: { width: number; height: number },
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(baseBytes);
    pdfDoc.insertPage(Math.max(0, Math.min(atIndex, pdfDoc.getPageCount())), [size.width, size.height]);
    return await pdfDoc.save();
  }

  static async replacePage(
    baseBytes: Uint8Array,
    targetIndex: number,
    donorBytes: Uint8Array,
    donorPageIndex: number,
  ): Promise<Uint8Array> {
    const baseDoc = await PDFDocument.load(baseBytes);
    const donorDoc = await PDFDocument.load(donorBytes);
    const outDoc = await PDFDocument.create();

    const donorCopied = await outDoc.copyPages(donorDoc, [donorPageIndex]);
    const replacement = donorCopied[0];

    for (const index of baseDoc.getPageIndices()) {
      if (index === targetIndex) {
        outDoc.addPage(replacement);
      } else {
        const [copied] = await outDoc.copyPages(baseDoc, [index]);
        outDoc.addPage(copied);
      }
    }

    return await outDoc.save();
  }

  static async extractPages(baseBytes: Uint8Array, pageIndices: number[]): Promise<Uint8Array> {
    const srcDoc = await PDFDocument.load(baseBytes);
    const outDoc = await PDFDocument.create();
    const normalized = normalizePageIndices(pageIndices);
    const copied = await outDoc.copyPages(srcDoc, normalized);
    copied.forEach((page) => outDoc.addPage(page));
    return await outDoc.save();
  }

  static async removePages(baseBytes: Uint8Array, pageIndices: number[]): Promise<Uint8Array> {
    const srcDoc = await PDFDocument.load(baseBytes);
    const toRemove = new Set(normalizePageIndices(pageIndices));
    const keepIndices = srcDoc.getPageIndices().filter((index) => !toRemove.has(index));

    if (keepIndices.length === 0) {
      throw new Error('Cannot remove all pages from the document');
    }

    const outDoc = await PDFDocument.create();
    const copied = await outDoc.copyPages(srcDoc, keepIndices);
    copied.forEach((page) => outDoc.addPage(page));
    return await outDoc.save();
  }

  static async duplicatePages(baseBytes: Uint8Array, pageIndices: number[]): Promise<Uint8Array> {
    const srcDoc = await PDFDocument.load(baseBytes);
    const selected = new Set(normalizePageIndices(pageIndices));

    const order: number[] = [];
    srcDoc.getPageIndices().forEach((index) => {
      order.push(index);
      if (selected.has(index)) {
        order.push(index);
      }
    });

    const outDoc = await PDFDocument.create();
    const copied = await outDoc.copyPages(srcDoc, order);
    copied.forEach((page) => outDoc.addPage(page));
    return await outDoc.save();
  }

  static async rotatePages(
    baseBytes: Uint8Array,
    pageIndices: number[],
    deltaDegrees: number,
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(baseBytes);
    const selected = new Set(normalizePageIndices(pageIndices));

    pdfDoc.getPages().forEach((page, index) => {
      if (!selected.has(index)) {
        return;
      }
      const nextRotation = (page.getRotation().angle + deltaDegrees + 360) % 360;
      page.setRotation(degrees(nextRotation));
    });

    return await pdfDoc.save();
  }

  static async movePage(baseBytes: Uint8Array, fromIndex: number, toIndex: number): Promise<Uint8Array> {
    const srcDoc = await PDFDocument.load(baseBytes);
    const pageCount = srcDoc.getPageCount();

    if (fromIndex < 0 || fromIndex >= pageCount || toIndex < 0 || toIndex >= pageCount) {
      throw new Error('Page move indices are out of range');
    }

    const order = srcDoc.getPageIndices();
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);

    const out = await PDFDocument.create();
    const copied = await out.copyPages(srcDoc, order);
    copied.forEach((page) => out.addPage(page));
    return await out.save();
  }

  static async reorderPages(baseBytes: Uint8Array, order: number[]): Promise<Uint8Array> {
    const srcDoc = await PDFDocument.load(baseBytes);
    const pageCount = srcDoc.getPageCount();

    if (order.length !== pageCount) {
      throw new Error('Reorder list length does not match page count');
    }

    const sorted = [...order].sort((a, b) => a - b);
    for (let index = 0; index < pageCount; index += 1) {
      if (sorted[index] !== index) {
        throw new Error('Reorder list is not a valid page permutation');
      }
    }

    const out = await PDFDocument.create();
    const copied = await out.copyPages(srcDoc, order);
    copied.forEach((page) => out.addPage(page));
    return await out.save();
  }

  static async insertImage(
    baseBytes: Uint8Array,
    options: {
      pages: number[];
      imageBytes: Uint8Array;
      mimeType: 'image/jpeg' | 'image/png';
      x: number;
      y: number;
      width?: number;
      height?: number;
      scale?: number;
    }
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(baseBytes);
    const image = options.mimeType === 'image/jpeg'
      ? await pdfDoc.embedJpg(options.imageBytes)
      : await pdfDoc.embedPng(options.imageBytes);

    let drawWidth = image.width;
    let drawHeight = image.height;

    if (options.width && options.height) {
      drawWidth = options.width;
      drawHeight = options.height;
    } else if (options.scale) {
      drawWidth = image.width * options.scale;
      drawHeight = image.height * options.scale;
    }

    for (const pageIndex of options.pages) {
      const page = pdfDoc.getPage(pageIndex);
      const pageHeight = page.getHeight();

      const drawY = pageHeight - options.y - drawHeight;

      page.drawImage(image, {
        x: options.x,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    return await pdfDoc.save();
  }

  static async injectRichText(
    baseBytes: Uint8Array,
    options: {
      pages: number[];
      text: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
      fontSize: number;
      color: string;
      opacity: number;
      fileName: string;
      now: Date;
      enablePageNumberToken: boolean;
      enableFileNameToken: boolean;
      enableDateToken: boolean;
      textAlign: 'left' | 'center' | 'right' | 'justify';
    }
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(baseBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = pdfDoc.getPageCount();

    for (const pageIndex of options.pages) {
      const page = pdfDoc.getPage(pageIndex);
      const width = page.getWidth();
      const height = page.getHeight();

      const text = resolveHeaderFooterTokens(options.text, {
        page: pageIndex + 1,
        pages: totalPages,
        file: options.fileName,
        date: options.now.toLocaleDateString(),
        enablePageNumberToken: options.enablePageNumberToken,
        enableFileNameToken: options.enableFileNameToken,
        enableDateToken: options.enableDateToken,
      });

      const maxWidth = options.width ?? (width - options.x);

      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + ' ' + word;
        const testWidth = font.widthOfTextAtSize(testLine, options.fontSize);
        if (testWidth > maxWidth && i > 0) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);

      let drawY = height - options.y - options.fontSize;

      for (const line of lines) {
        const lineWidth = font.widthOfTextAtSize(line, options.fontSize);
        let drawX = options.x;
        if (options.textAlign === 'center') {
          drawX = options.x + (maxWidth - lineWidth) / 2;
        } else if (options.textAlign === 'right') {
          drawX = options.x + maxWidth - lineWidth;
        }

        page.drawText(line, {
          x: drawX,
          y: drawY,
          font,
          size: options.fontSize,
          color: hexToRgb(options.color),
          opacity: options.opacity,
          maxWidth
        });

        drawY -= options.fontSize * 1.2;
      }
    }

    return await pdfDoc.save();
  }

  static async addHeaderFooterText(
    baseBytes: Uint8Array,
    options: HeaderFooterOptions,
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(baseBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = pdfDoc.getPageCount();

    for (const pageIndex of options.pages) {
      const page = pdfDoc.getPage(pageIndex);
      const width = page.getWidth();
      const height = page.getHeight();

      const text = resolveHeaderFooterTokens(options.text, {
        page: pageIndex + 1,
        pages: totalPages,
        file: options.fileName,
        date: options.now.toLocaleDateString(),
        enablePageNumberToken: options.enablePageNumberToken,
        enableFileNameToken: options.enableFileNameToken,
        enableDateToken: options.enableDateToken,
      });

      const textWidth = font.widthOfTextAtSize(text, options.fontSize);
      const x =
        options.align === 'left'
          ? options.marginX
          : options.align === 'center'
          ? (width - textWidth) / 2
          : width - options.marginX - textWidth;
      const y =
        options.zone === 'header'
          ? height - options.marginY - options.fontSize
          : options.marginY;

      page.drawText(text, {
        x,
        y,
        font,
        size: options.fontSize,
        color: hexToRgb(options.color),
        opacity: options.opacity,
      });
    }

    return await pdfDoc.save();
  }

  static async rotatePage(baseBytes: Uint8Array, pageIndex: number, deltaDegrees: number): Promise<Uint8Array> {
    return this.rotatePages(baseBytes, [pageIndex], deltaDegrees);
  }

  static async deletePage(baseBytes: Uint8Array, pageIndex: number): Promise<Uint8Array> {
    return this.removePages(baseBytes, [pageIndex]);
  }

  static async exportWithAnnotations(baseBytes: Uint8Array, annotations: PdfAnnotation[]): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(baseBytes);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const annotation of annotations) {
      if (annotation.pageNumber < 1 || annotation.pageNumber > pdfDoc.getPageCount()) {
        continue;
      }

      const page = pdfDoc.getPage(annotation.pageNumber - 1);
      const x = annotation.rect.x;
      const y = page.getHeight() - annotation.rect.y - annotation.rect.height;

      const text =
        (typeof annotation.data.text === 'string' && annotation.data.text) ||
        (typeof annotation.data.content === 'string' && annotation.data.content) ||
        (annotation.type === 'stamp' ? 'STAMP' : '');

      const borderColor =
        typeof annotation.data.borderColor === 'string'
          ? hexToRgb(annotation.data.borderColor)
          : annotation.type === 'stamp'
          ? rgb(0.85, 0.2, 0.2)
          : rgb(0.2, 0.4, 0.8);
      const fillColor =
        typeof annotation.data.backgroundColor === 'string'
          ? hexToRgb(annotation.data.backgroundColor)
          : annotation.type === 'stamp'
          ? rgb(1, 0.94, 0.94)
          : rgb(0.96, 0.97, 1);

      if (annotation.type === 'highlight') {
        page.drawRectangle({
          x,
          y,
          width: annotation.rect.width,
          height: annotation.rect.height,
          color:
            typeof annotation.data.backgroundColor === 'string'
              ? hexToRgb(annotation.data.backgroundColor)
              : rgb(1, 0.92, 0.2),
          opacity: typeof annotation.data.opacity === 'number' ? annotation.data.opacity : 0.35,
          borderWidth: 0,
        });
        continue;
      }

      if (annotation.type === 'shape') {
        page.drawRectangle({
          x,
          y,
          width: annotation.rect.width,
          height: annotation.rect.height,
          borderWidth: typeof annotation.data.borderWidth === 'number' ? annotation.data.borderWidth : 1,
          borderColor,
        });
        continue;
      }

      if (annotation.type === 'line' || annotation.type === 'arrow') {
        const points = Array.isArray(annotation.data.points)
          ? annotation.data.points
          : [0, annotation.rect.height / 2, annotation.rect.width, annotation.rect.height / 2];

        const x1 = x + points[0];
        const y1 = y + annotation.rect.height - points[1];
        const x2 = x + points[2];
        const y2 = y + annotation.rect.height - points[3];

        page.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness: 2,
          color: borderColor,
        });

        if (annotation.type === 'arrow') {
          drawArrowHead(page, x1, y1, x2, y2, borderColor, 2);
        }
        continue;
      }

      if (annotation.type === 'callout') {
        const anchor =
          annotation.data.anchor &&
          typeof annotation.data.anchor === 'object' &&
          typeof (annotation.data.anchor as { x?: unknown }).x === 'number' &&
          typeof (annotation.data.anchor as { y?: unknown }).y === 'number'
            ? (annotation.data.anchor as { x: number; y: number })
            : null;

        if (anchor) {
          const x1 = anchor.x;
          const y1 = page.getHeight() - anchor.y;
          const x2 = x;
          const y2 = y + annotation.rect.height / 2;

          page.drawLine({
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
            thickness: 2,
            color: borderColor,
          });
        }

        page.drawRectangle({
          x: x + 18,
          y,
          width: Math.max(20, annotation.rect.width - 18),
          height: annotation.rect.height,
          color: fillColor,
          opacity: typeof annotation.data.opacity === 'number' ? annotation.data.opacity : 0.8,
          borderWidth: typeof annotation.data.borderWidth === 'number' ? annotation.data.borderWidth : 1,
          borderColor,
        });

        page.drawLine({
          start: { x, y: y + annotation.rect.height / 2 },
          end: { x: x + 18, y: y + annotation.rect.height / 2 },
          thickness: 2,
          color: borderColor,
        });

        if (text) {
          page.drawText(text, {
            x: x + 24,
            y: y + Math.max(8, annotation.rect.height - 18),
            font: helvetica,
            size: typeof annotation.data.fontSize === 'number' ? annotation.data.fontSize : 12,
            color:
              typeof annotation.data.textColor === 'string'
                ? hexToRgb(annotation.data.textColor)
                : rgb(0.12, 0.12, 0.12),
            maxWidth: Math.max(20, annotation.rect.width - 30),
            rotate:
              typeof annotation.data.rotation === 'number'
                ? degrees(annotation.data.rotation)
                : undefined,
          });
        }
        continue;
      }

      if (text) {
        page.drawRectangle({
          x,
          y,
          width: annotation.rect.width,
          height: annotation.rect.height,
          color: fillColor,
          opacity: typeof annotation.data.opacity === 'number' ? annotation.data.opacity : 0.75,
          borderWidth: typeof annotation.data.borderWidth === 'number' ? annotation.data.borderWidth : 1,
          borderColor,
        });

        page.drawText(text, {
          x: x + 6,
          y: y + Math.max(8, annotation.rect.height - 18),
          font: helvetica,
          size: typeof annotation.data.fontSize === 'number' ? annotation.data.fontSize : 12,
          color:
            typeof annotation.data.textColor === 'string'
              ? hexToRgb(annotation.data.textColor)
              : annotation.type === 'stamp'
              ? rgb(0.75, 0.1, 0.1)
              : rgb(0.12, 0.12, 0.12),
          maxWidth: Math.max(20, annotation.rect.width - 12),
          rotate:
            typeof annotation.data.rotation === 'number'
              ? degrees(annotation.data.rotation)
              : undefined,
        });
      }
    }

    return await pdfDoc.save();
  }
}

