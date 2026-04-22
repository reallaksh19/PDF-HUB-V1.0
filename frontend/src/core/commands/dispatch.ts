import { v4 as uuidv4 } from 'uuid';
import { DocumentCommand, CommandResult } from './types';
import { useSessionStore } from '../session/store';
import { useDocumentHistoryStore } from '../document-history/store';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { executeMacroRecipe } from '../macro/executor';

export async function dispatchCommand(command: DocumentCommand): Promise<CommandResult> {
  const session = useSessionStore.getState();
  const history = useDocumentHistoryStore.getState();

  const { workingBytes, pageCount } = session;
  if (!workingBytes) {
    return { success: false, error: 'No active document' };
  }

  const { payload, context } = command;

  // Handle undo/redo separately as they manipulate history store directly
  if (payload.type === 'UNDO') {
    const transaction = history.popUndo();
    if (!transaction) return { success: false, error: 'Nothing to undo' };

    // If we undo to the initial document state (no previous history), it is no longer dirty
    const isDirtyAfterUndo = history.canUndo();

    session.replaceWorkingCopy(transaction.previousBytes, transaction.previousPageCount);
    if (!isDirtyAfterUndo) {
        session.setDocumentDirty(false);
        session.setDirty(false);
    }
    history.pushRedo(transaction);
    return { success: true, workingBytes: transaction.previousBytes, pageCount: transaction.previousPageCount };
  }

  if (payload.type === 'REDO') {
    const transaction = history.popRedo();
    if (!transaction) return { success: false, error: 'Nothing to redo' };

    session.replaceWorkingCopy(transaction.nextBytes, transaction.nextPageCount);
    history.pushUndo(transaction);
    return { success: true, workingBytes: transaction.nextBytes, pageCount: transaction.nextPageCount };
  }

  let nextBytes: Uint8Array = workingBytes;
  let nextPageCount: number = pageCount;
  let mutates = true;
  let extractedOutputs: Array<{ name: string; bytes: Uint8Array }> = [];

  try {
    switch (payload.type) {
      case 'ROTATE_PAGES':
        nextBytes = await PdfEditAdapter.rotatePages(workingBytes, payload.pageIndices, payload.degrees);
        nextPageCount = await PdfEditAdapter.countPages(nextBytes);
        break;

      case 'DELETE_PAGES':
        nextBytes = await PdfEditAdapter.removePages(workingBytes, payload.pageIndices);
        nextPageCount = await PdfEditAdapter.countPages(nextBytes);
        break;

      case 'INSERT_BLANK_PAGE':
        nextBytes = await PdfEditAdapter.insertBlankPage(workingBytes, payload.atIndex, payload.size);
        nextPageCount = await PdfEditAdapter.countPages(nextBytes);
        break;

      case 'REPLACE_PAGE':
        nextBytes = await PdfEditAdapter.replacePage(
          workingBytes,
          payload.targetPageIndex,
          payload.donorBytes,
          payload.donorPageIndex
        );
        nextPageCount = await PdfEditAdapter.countPages(nextBytes);
        break;

      case 'DUPLICATE_PAGES':
        nextBytes = await PdfEditAdapter.duplicatePages(workingBytes, payload.pageIndices);
        nextPageCount = await PdfEditAdapter.countPages(nextBytes);
        break;

      case 'EXTRACT_PAGES': {
        mutates = false; // Does not mutate the original document
        const extractedBytes = await PdfEditAdapter.extractPages(workingBytes, payload.pageIndices);
        extractedOutputs.push({
          name: `extract-${payload.pageIndices.map(p => p + 1).join('-')}.pdf`,
          bytes: extractedBytes
        });
        break;
      }

      case 'SPLIT_PAGES': {
        const splitExtracted = await PdfEditAdapter.extractPages(workingBytes, payload.pageIndices);
        extractedOutputs.push({
          name: `split-${payload.pageIndices.map(p => p + 1).join('-')}.pdf`,
          bytes: splitExtracted
        });
        nextBytes = await PdfEditAdapter.removePages(workingBytes, payload.pageIndices);
        nextPageCount = await PdfEditAdapter.countPages(nextBytes);
        break;
      }

      case 'MERGE_FILES':
        nextBytes = await PdfEditAdapter.merge(workingBytes, payload.donorBytesList);
        nextPageCount = await PdfEditAdapter.countPages(nextBytes);
        break;

      case 'INSERT_FROM_PDF':
        nextBytes = await PdfEditAdapter.insertAt(workingBytes, payload.donorBytes, payload.atIndex);
        nextPageCount = await PdfEditAdapter.countPages(nextBytes);
        break;

      case 'REORDER_PAGES':
        nextBytes = await PdfEditAdapter.reorderPages(workingBytes, payload.order);
        nextPageCount = await PdfEditAdapter.countPages(nextBytes);
        break;

      case 'APPLY_MACRO': {
        const macroResult = await executeMacroRecipe(
          {
            workingBytes,
            pageCount,
            selectedPages: session.selectedPages,
            currentPage: session.viewState.currentPage,
            fileName: session.fileName || 'document.pdf',
            donorFiles: payload.donorFiles || {},
            now: new Date(context.timestamp),
          },
          payload.recipe
        );
        nextBytes = macroResult.workingBytes;
        nextPageCount = macroResult.pageCount;
        extractedOutputs = macroResult.extractedOutputs;
        break;
      }

      default:
        return { success: false, error: 'Unknown command' };
    }

    if (mutates) {
      history.pushTransaction({
        id: uuidv4(),
        timestamp: context.timestamp,
        commandPayload: payload,
        previousBytes: workingBytes,
        previousPageCount: pageCount,
        nextBytes,
        nextPageCount,
      });

      session.replaceWorkingCopy(nextBytes, nextPageCount);
    }

    return {
      success: true,
      workingBytes: nextBytes,
      pageCount: nextPageCount,
      extractedOutputs: extractedOutputs.length > 0 ? extractedOutputs : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
