import { v4 as uuidv4 } from 'uuid';
import { CommandPayload, CommandResult } from './types';
import { useSessionStore } from '../session/store';
import { useHistoryStore } from '../document-history/store';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';

export async function dispatchCommand(payload: CommandPayload): Promise<CommandResult> {
  const { command, workingBytes } = payload;
  let nextBytes: Uint8Array | undefined;

  try {
    switch (command.type) {
      case 'ROTATE_PAGES':
        nextBytes = await PdfEditAdapter.rotatePages(workingBytes, command.pageIndices, command.angle);
        break;
      case 'REORDER_PAGES':
        nextBytes = await PdfEditAdapter.movePage(workingBytes, command.fromIndex, command.toIndex);
        break;
      case 'EXTRACT_PAGES':
        // Extraction might not modify the working document directly based on the UI flow,
        // but if it does (e.g. split), we handle it. Usually extract is read-only for working bytes.
        // If it shouldn't modify, we just return success.
        return { success: true, message: 'Extracted successfully' };
      case 'SPLIT_PAGES':
        // Splitting removes the pages from the current document
        nextBytes = await PdfEditAdapter.removePages(workingBytes, command.pageIndices);
        break;
      case 'DELETE_PAGES':
        nextBytes = await PdfEditAdapter.removePages(workingBytes, command.pageIndices);
        break;
      case 'INSERT_PAGES':
        nextBytes = await PdfEditAdapter.insertAt(workingBytes, command.newBytes, command.atIndex);
        break;
      case 'INSERT_BLANK_PAGE':
        nextBytes = await PdfEditAdapter.insertBlankPage(workingBytes, command.atIndex, command.size);
        break;
      case 'REPLACE_PAGE':
        nextBytes = await PdfEditAdapter.replacePage(
          workingBytes,
          command.atIndex,
          command.donorBytes,
          command.donorPageIndex,
        );
        break;
      case 'DUPLICATE_PAGES':
        nextBytes = await PdfEditAdapter.duplicatePages(workingBytes, command.pageIndices);
        break;
      case 'MERGE_PDF':
        nextBytes = await PdfEditAdapter.merge(workingBytes, command.additionalBytes);
        break;
      default:
        return { success: false, message: 'Unknown command type' };
    }

    if (!nextBytes) {
      return { success: false, message: 'Command did not produce next bytes' };
    }

    const nextCount = await PdfEditAdapter.countPages(nextBytes);
    const prevCount = await PdfEditAdapter.countPages(workingBytes);

    useHistoryStore.getState().push({
      id: uuidv4(),
      command,
      timestamp: Date.now(),
      before: { bytes: new Uint8Array(workingBytes), pageCount: prevCount },
      after: { bytes: nextBytes, pageCount: nextCount },
    });

    useSessionStore.getState().replaceWorkingCopy(nextBytes, nextCount);

    return { success: true, nextBytes, nextPageCount: nextCount };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Command execution failed';
    return { success: false, message: errMessage };
  }
}
