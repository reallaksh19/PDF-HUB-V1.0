import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import type { DocumentCommand, CommandResult } from './types';
import { useSessionStore } from '../session/store';
import { useHistoryStore } from '../document-history/store';

export async function dispatchCommand(command: DocumentCommand): Promise<CommandResult> {
  const session = useSessionStore.getState();
  const { workingBytes, pageCount } = session;

  if (!workingBytes) {
    return { success: false, error: 'No working document available' };
  }

  let resultBytes: Uint8Array | undefined;
  let newPageCount = pageCount;

  try {
    switch (command.type) {
      case 'rotate-pages': {
        const payload = command.payload;
        if (payload.type !== 'rotate-pages') throw new Error('Invalid payload for rotate-pages');
        resultBytes = await PdfEditAdapter.rotatePages(workingBytes, payload.pageIndices, payload.deltaDegrees);
        break;
      }
      case 'extract-pages': {
        const payload = command.payload;
        if (payload.type !== 'extract-pages') throw new Error('Invalid payload for extract-pages');
        resultBytes = await PdfEditAdapter.extractPages(workingBytes, payload.pageIndices);
        newPageCount = await PdfEditAdapter.countPages(resultBytes);
        break;
      }
      case 'delete-pages': {
        const payload = command.payload;
        if (payload.type !== 'delete-pages') throw new Error('Invalid payload for delete-pages');
        resultBytes = await PdfEditAdapter.removePages(workingBytes, payload.pageIndices);
        newPageCount = await PdfEditAdapter.countPages(resultBytes);
        break;
      }
      case 'reorder-pages': {
        const payload = command.payload;
        if (payload.type !== 'reorder-pages') throw new Error('Invalid payload for reorder-pages');
        resultBytes = await PdfEditAdapter.reorderPages(workingBytes, payload.order);
        break;
      }
      case 'move-page': {
        const payload = command.payload;
        if (payload.type !== 'move-page') throw new Error('Invalid payload for move-page');
        resultBytes = await PdfEditAdapter.movePage(workingBytes, payload.fromIndex, payload.toIndex);
        break;
      }
      case 'duplicate-pages': {
        const payload = command.payload;
        if (payload.type !== 'duplicate-pages') throw new Error('Invalid payload for duplicate-pages');
        resultBytes = await PdfEditAdapter.duplicatePages(workingBytes, payload.pageIndices);
        newPageCount = await PdfEditAdapter.countPages(resultBytes);
        break;
      }
      case 'insert-page': {
        const payload = command.payload;
        if (payload.type !== 'insert-page') throw new Error('Invalid payload for insert-page');
        resultBytes = await PdfEditAdapter.insertAt(workingBytes, payload.insertBytes, payload.atIndex);
        newPageCount = await PdfEditAdapter.countPages(resultBytes);
        break;
      }
      case 'replace-page': {
        const payload = command.payload;
        if (payload.type !== 'replace-page') throw new Error('Invalid payload for replace-page');
        resultBytes = await PdfEditAdapter.replacePage(workingBytes, payload.targetIndex, payload.donorBytes, payload.donorPageIndex);
        newPageCount = await PdfEditAdapter.countPages(resultBytes);
        break;
      }
      case 'add-header-footer': {
        const payload = command.payload;
        if (payload.type !== 'add-header-footer') throw new Error('Invalid payload for add-header-footer');
        resultBytes = await PdfEditAdapter.addHeaderFooterText(workingBytes, payload.options);
        break;
      }
      // 'batch-text' and 'split-document' are left to implement or add to adapter if needed
      default:
        throw new Error(`Command type ${command.type} not supported yet.`);
    }

    if (resultBytes) {
      // Record transaction
      useHistoryStore.getState().pushTransaction({
        id: crypto.randomUUID(),
        commandType: command.type,
        timestamp: Date.now(),
        beforeBytes: workingBytes,
        beforePageCount: pageCount,
        afterBytes: resultBytes,
        afterPageCount: newPageCount,
      });

      // Apply to session
      session.replaceWorkingCopy(resultBytes, newPageCount);
      session.setDocumentDirty?.(true);

      return { success: true, bytes: resultBytes, pageCount: newPageCount };
    }

    return { success: false, error: 'Command did not return mutated bytes' };
  } catch (error: unknown) {
    return { success: false, error: (error as Error)?.message || 'Unknown error during command execution' };
  }
}
