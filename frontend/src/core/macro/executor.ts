import type {
  InsertPosition,
  MacroExecutionContext,
  MacroRecipe,
  MacroRunResult,
  PageSelector,
} from './types';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';

export async function executeMacroRecipe(
  ctx: MacroExecutionContext,
  recipe: MacroRecipe,
): Promise<MacroRunResult> {
  let workingBytes = ctx.workingBytes;
  let pageCount = ctx.pageCount;
  let selectedPages = [...ctx.selectedPages];
  const logs: string[] = [];
  const extractedOutputs: Array<{ name: string; bytes: Uint8Array }> = [];

  for (const step of recipe.steps) {
    switch (step.op) {
      case 'select_pages': {
        selectedPages = resolvePageSelector(step.selector, pageCount, {
          currentPage: ctx.currentPage,
          selectedPages,
        });
        logs.push(`Selected pages: ${selectedPages.join(', ') || 'none'}`);
        break;
      }

      case 'merge_files': {
        const donors = step.donorFileIds
          .map((id) => ctx.donorFiles[id])
          .filter((value): value is Uint8Array => value instanceof Uint8Array);

        if (donors.length === 0) {
          logs.push('Skipped merge_files: no donor files found');
          break;
        }

        workingBytes = await PdfEditAdapter.merge(workingBytes, donors);
        pageCount = await PdfEditAdapter.countPages(workingBytes);
        logs.push(`Merged ${donors.length} donor file(s)`);
        break;
      }

      case 'insert_pdf': {
        const donor = ctx.donorFiles[step.donorFileId];
        if (!donor) {
          logs.push(`Skipped insert_pdf: missing donor file ${step.donorFileId}`);
          break;
        }

        workingBytes = await PdfEditAdapter.insertAt(
          workingBytes,
          donor,
          clamp(step.atIndex, 0, pageCount),
        );
        pageCount = await PdfEditAdapter.countPages(workingBytes);
        logs.push(`Inserted donor PDF at index ${step.atIndex}`);
        break;
      }

      case 'extract_pages': {
        const pages = resolvePageSelector(step.selector, pageCount, {
          currentPage: ctx.currentPage,
          selectedPages,
        });
        if (pages.length === 0) {
          logs.push('Skipped extract_pages: no pages selected');
          break;
        }

        const bytes = await PdfEditAdapter.extractPages(
          workingBytes,
          pages.map((p) => p - 1),
        );
        extractedOutputs.push({
          name: step.outputName ?? `extract-${pages.join('-')}.pdf`,
          bytes,
        });
        logs.push(`Extracted pages: ${pages.join(', ')}`);
        break;
      }

      case 'split_pages': {
        const pages = resolvePageSelector(step.selector, pageCount, {
          currentPage: ctx.currentPage,
          selectedPages,
        });
        if (pages.length === 0) {
          logs.push('Skipped split_pages: no pages selected');
          break;
        }

        const extracted = await PdfEditAdapter.extractPages(
          workingBytes,
          pages.map((p) => p - 1),
        );

        workingBytes = await PdfEditAdapter.removePages(
          workingBytes,
          pages.map((p) => p - 1),
        );
        pageCount = await PdfEditAdapter.countPages(workingBytes);

        extractedOutputs.push({
          name: step.outputName ?? `split-${pages.join('-')}.pdf`,
          bytes: extracted,
        });

        selectedPages = [];
        logs.push(`Split out pages: ${pages.join(', ')}`);
        break;
      }

      case 'insert_image': {
        const donor = ctx.donorFiles[step.donorFileId];
        if (!donor) {
          logs.push(`Skipped insert_image: missing donor file ${step.donorFileId}`);
          break;
        }

        const pages = resolvePageSelector(step.selector, pageCount, {
          currentPage: ctx.currentPage,
          selectedPages,
        });

        if (pages.length === 0) {
          logs.push('Skipped insert_image: no pages selected');
          break;
        }

        workingBytes = await PdfEditAdapter.insertImage(workingBytes, donor, {
          pages: pages.map((p) => p - 1),
          x: step.x,
          y: step.y,
          width: step.width,
          height: step.height,
        });
        logs.push(`Inserted image ${step.donorFileId} on pages: ${pages.join(', ')}`);
        break;
      }

      case 'inject_rich_text': {
        const pages = resolvePageSelector(step.selector, pageCount, {
          currentPage: ctx.currentPage,
          selectedPages,
        });

        if (pages.length === 0) {
          logs.push('Skipped inject_rich_text: no pages selected');
          break;
        }

        // For now, rich text maps to basic text drawing. In a full implementation,
        // HTML to PDF layout parsing would be done here using a library like html2canvas or pdfmake
        // or by utilizing a specialized PdfEditAdapter method.
        workingBytes = await PdfEditAdapter.drawTextOnPages(workingBytes, {
          pages: pages.map((p) => p - 1),
          text: step.html,
          x: step.x,
          y: step.y,
          fontSize: 12,
          color: '#000000',
          align: 'left',
          now: ctx.now,
          fileName: ctx.fileName,
          enablePageNumberToken: true,
          enableFileNameToken: true,
          enableDateToken: true,
        });
        logs.push(`Injected rich text on pages: ${pages.join(', ')}`);
        break;
      }

      case 'duplicate_pages': {
        const pages = resolvePageSelector(step.selector, pageCount, {
          currentPage: ctx.currentPage,
          selectedPages,
        });
        if (pages.length === 0) {
          logs.push('Skipped duplicate_pages: no pages selected');
          break;
        }

        workingBytes = await PdfEditAdapter.duplicatePages(
          workingBytes,
          pages.map((p) => p - 1),
        );
        pageCount = await PdfEditAdapter.countPages(workingBytes);
        logs.push(`Duplicated pages: ${pages.join(', ')}`);
        break;
      }

      case 'rotate_pages': {
        const pages = resolvePageSelector(step.selector, pageCount, {
          currentPage: ctx.currentPage,
          selectedPages,
        });
        if (pages.length === 0) {
          logs.push('Skipped rotate_pages: no pages selected');
          break;
        }

        workingBytes = await PdfEditAdapter.rotatePages(
          workingBytes,
          pages.map((p) => p - 1),
          step.degrees,
        );
        logs.push(`Rotated pages ${pages.join(', ')} by ${step.degrees}°`);
        break;
      }

      case 'remove_pages': {
        const pages = resolvePageSelector(step.selector, pageCount, {
          currentPage: ctx.currentPage,
          selectedPages,
        });
        if (pages.length === 0) {
          logs.push('Skipped remove_pages: no pages selected');
          break;
        }

        workingBytes = await PdfEditAdapter.removePages(
          workingBytes,
          pages.map((p) => p - 1),
        );
        pageCount = await PdfEditAdapter.countPages(workingBytes);
        selectedPages = [];
        logs.push(`Removed pages: ${pages.join(', ')}`);
        break;
      }

      case 'insert_blank_page': {
        const count = Math.max(1, step.count ?? 1);
        for (let index = 0; index < count; index += 1) {
          const atIndex = await resolveInsertIndex(step.position, ctx.currentPage, pageCount);
          const size = await resolveBlankPageSize(
            step.size,
            workingBytes,
            atIndex,
            pageCount,
          );

          workingBytes = await PdfEditAdapter.insertBlankPage(workingBytes, atIndex, size);
          pageCount = await PdfEditAdapter.countPages(workingBytes);
        }

        logs.push(`Inserted ${count} blank page(s)`);
        break;
      }

      case 'replace_page': {
        const donor = ctx.donorFiles[step.donorFileId];
        if (!donor) {
          logs.push(`Skipped replace_page: missing donor file ${step.donorFileId}`);
          break;
        }

        workingBytes = await PdfEditAdapter.replacePage(
          workingBytes,
          step.targetPage - 1,
          donor,
          step.donorPage - 1,
        );
        logs.push(`Replaced page ${step.targetPage} with donor page ${step.donorPage}`);
        break;
      }

      case 'reorder_pages': {
        if (step.order.length !== pageCount) {
          logs.push('Skipped reorder_pages: order length does not match page count');
          break;
        }

        workingBytes = await PdfEditAdapter.reorderPages(
          workingBytes,
          step.order.map((p) => p - 1),
        );
        pageCount = await PdfEditAdapter.countPages(workingBytes);
        logs.push('Reordered pages');
        break;
      }

      case 'header_footer_text': {
        const pages = resolvePageSelector(step.selector, pageCount, {
          currentPage: ctx.currentPage,
          selectedPages,
        }).filter((page) => {
          if (step.excludeFirstPage && page === 1) {
            return false;
          }
          if (step.excludeLastPage && page === pageCount) {
            return false;
          }
          return true;
        });

        if (pages.length === 0) {
          logs.push('Skipped header_footer_text: no pages selected');
          break;
        }

        workingBytes = await PdfEditAdapter.addHeaderFooterText(workingBytes, {
          pages: pages.map((p) => p - 1),
          zone: step.zone,
          text: step.text,
          align: step.align,
          marginX: step.marginX,
          marginY: step.marginY,
          fontSize: step.fontSize,
          color: step.color ?? '#374151',
          opacity: step.opacity ?? 0.9,
          fileName: ctx.fileName,
          now: ctx.now,
          enablePageNumberToken: step.pageNumberToken ?? true,
          enableFileNameToken: step.fileNameToken ?? false,
          enableDateToken: step.dateToken ?? false,
        });

        logs.push(`Applied ${step.zone} text to pages: ${pages.join(', ')}`);
        break;
      }

      case 'draw_text_on_pages': {
        const pages = resolvePageSelector(step.selector, pageCount, {
          currentPage: ctx.currentPage,
          selectedPages,
        });

        if (pages.length === 0) {
          logs.push('Skipped draw_text_on_pages: no pages selected');
          break;
        }

        workingBytes = await PdfEditAdapter.drawTextOnPages(workingBytes, {
          pages: pages.map((p) => p - 1),
          text: step.text,
          x: step.x,
          y: step.y,
          fontSize: step.fontSize,
          color: step.color ?? '#111827',
          opacity: step.opacity ?? 0.95,
          align: step.align ?? 'left',
          fileName: ctx.fileName,
          now: ctx.now,
          enablePageNumberToken: step.pageNumberToken ?? true,
          enableFileNameToken: step.fileNameToken ?? false,
          enableDateToken: step.dateToken ?? false,
        });

        logs.push(`Drew text on pages: ${pages.join(', ')}`);
        break;
      }

      default:
        assertNever(step);
    }
  }

  return {
    workingBytes,
    pageCount,
    selectedPages,
    logs,
    extractedOutputs,
    outputs: extractedOutputs,
  };
}

export function resolvePageSelector(
  selector: PageSelector,
  pageCount: number,
  state: { currentPage: number; selectedPages: number[] },
): number[] {
  switch (selector.mode) {
    case 'all':
      return rangeInclusive(1, pageCount);

    case 'current':
      return [clamp(state.currentPage, 1, Math.max(1, pageCount))];

    case 'selected':
      return state.selectedPages.length > 0
        ? Array.from(new Set(state.selectedPages))
            .filter((page) => page >= 1 && page <= pageCount)
            .sort((a, b) => a - b)
        : [clamp(state.currentPage, 1, Math.max(1, pageCount))];

    case 'range':
      return rangeInclusive(
        clamp(selector.from, 1, pageCount),
        clamp(selector.to, 1, pageCount),
      );

    case 'list':
      return Array.from(new Set(selector.pages))
        .filter((page) => page >= 1 && page <= pageCount)
        .sort((a, b) => a - b);

    case 'odd':
      return rangeInclusive(1, pageCount).filter((page) => page % 2 === 1);

    case 'even':
      return rangeInclusive(1, pageCount).filter((page) => page % 2 === 0);
  }
}

async function resolveInsertIndex(
  position: InsertPosition,
  _currentPage: number,
  pageCount: number,
): Promise<number> {
  switch (position.mode) {
    case 'start':
      return 0;
    case 'end':
      return pageCount;
    case 'before':
      return clamp(position.page - 1, 0, pageCount);
    case 'after':
      return clamp(position.page, 0, pageCount);
  }
}

async function resolveBlankPageSize(
  size: 'match-current' | 'a4' | 'letter' | { width: number; height: number },
  workingBytes: Uint8Array,
  atIndex: number,
  pageCount: number,
): Promise<{ width: number; height: number }> {
  if (typeof size === 'object') {
    return size;
  }
  if (size === 'a4') {
    return { width: 595, height: 842 };
  }
  if (size === 'letter') {
    return { width: 612, height: 792 };
  }

  const referenceIndex = clamp(
    atIndex === pageCount ? pageCount - 1 : atIndex,
    0,
    Math.max(0, pageCount - 1),
  );
  return await PdfEditAdapter.getPageSize(workingBytes, referenceIndex);
}

function rangeInclusive(from: number, to: number): number[] {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function assertNever(value: never): never {
  throw new Error(`Unhandled macro step: ${JSON.stringify(value)}`);
}
