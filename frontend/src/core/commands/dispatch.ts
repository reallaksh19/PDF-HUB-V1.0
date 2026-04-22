import { DocumentCommand } from './types';
import { useSessionStore } from '@/core/session/store';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { FileAdapter } from '@/adapters/file/FileAdapter';

const applyNewBytes = async (bytes: Uint8Array, nextPage?: number) => {
  const store = useSessionStore.getState();
  const nextCount = await PdfEditAdapter.countPages(bytes);
  store.replaceWorkingCopy(bytes, nextCount);
  store.clearSelectedPages();
  if (nextPage) {
    store.setPage(nextPage);
  }
};

export const dispatchDocumentCommand = async (args: {
  source: string;
  command: DocumentCommand;
}) => {
  const store = useSessionStore.getState();
  const { workingBytes, pageCount } = store;

  if (!workingBytes) {
    return { success: false, error: 'No working document' };
  }

  const { command } = args;

  try {
    switch (command.type) {
      case 'move-pages': {
        const pagesToMove = command.pages.map(p => p - 1);
        const targetIndex = command.targetIndex;

        const originalOrder = Array.from({ length: pageCount }, (_, i) => i);
        const remainingOrder = originalOrder.filter(i => !pagesToMove.includes(i));

        const newOrder = [...remainingOrder];

        const numPagesBeforeTarget = originalOrder.slice(0, targetIndex).filter(i => !pagesToMove.includes(i)).length;
        const spliceIndex = numPagesBeforeTarget;

        newOrder.splice(spliceIndex, 0, ...pagesToMove);

        const nextBytes = await PdfEditAdapter.reorderPages(workingBytes, newOrder);
        await applyNewBytes(nextBytes, targetIndex + 1);
        break;
      }
      case 'rotate-pages': {
        const nextBytes = await PdfEditAdapter.rotatePages(workingBytes, command.pages.map(p => p - 1), command.degrees);
        await applyNewBytes(nextBytes, command.pages[0]);
        break;
      }
      case 'extract-pages': {
        const extractedBytes = await PdfEditAdapter.extractPages(workingBytes, command.pages.map(p => p - 1));
        const name = `extract-pages-${command.pages.join('-')}.pdf`;
        await FileAdapter.savePdfBytes(extractedBytes, name, null);
        break;
      }
      case 'split-pages': {
        const extractedBytes = await PdfEditAdapter.extractPages(workingBytes, command.pages.map(p => p - 1));
        const remainingBytes = await PdfEditAdapter.removePages(workingBytes, command.pages.map(p => p - 1));
        const name = `split-pages-${command.pages.join('-')}.pdf`;
        await FileAdapter.savePdfBytes(extractedBytes, name, null);
        await applyNewBytes(remainingBytes, 1);
        break;
      }
      case 'duplicate-pages': {
        const nextBytes = await PdfEditAdapter.duplicatePages(workingBytes, command.pages.map(p => p - 1));
        await applyNewBytes(nextBytes, command.pages[0]);
        break;
      }
      case 'delete-pages': {
        const nextBytes = await PdfEditAdapter.removePages(workingBytes, command.pages.map(p => p - 1));
        await applyNewBytes(nextBytes, 1);
        break;
      }
      case 'insert-blank-page': {
        const size = command.size || { width: 595, height: 842 }; // default A4
        const nextBytes = await PdfEditAdapter.insertBlankPage(workingBytes, command.atIndex, size);
        await applyNewBytes(nextBytes, command.atIndex + 1);
        break;
      }
      case 'replace-page': {
        const [donor] = await FileAdapter.pickPdfFiles(false);
        if (donor) {
          const donorCount = await PdfEditAdapter.countPages(donor.bytes);
          const donorPageStr = window.prompt(`Donor page number (1-${donorCount})`, '1');
          if (donorPageStr) {
            const donorPage = Math.max(1, Math.min(donorCount, Number(donorPageStr) || 1));
            // Assuming we replace the first selected page
            const targetIndex = command.pages[0] - 1;
            const nextBytes = await PdfEditAdapter.replacePage(workingBytes, targetIndex, donor.bytes, donorPage - 1);
            await applyNewBytes(nextBytes, command.pages[0]);
          }
        }
        break;
      }
      case 'add-page-numbers': {
        const options = {
          pages: command.pages.map(p => p - 1),
          zone: 'footer' as const,
          text: 'Page {pageNumber} of {totalPages}',
          align: 'center' as const,
          marginX: 50,
          marginY: 30,
          fontSize: 12,
          color: '#000000',
          opacity: 1,
          fileName: 'document.pdf',
          now: new Date(),
          enablePageNumberToken: true,
          enableFileNameToken: false,
          enableDateToken: false,
        };
        const nextBytes = await PdfEditAdapter.addHeaderFooterText(workingBytes, options);
        await applyNewBytes(nextBytes, command.pages[0]);
        break;
      }
      case 'add-header-footer': {
        const text = window.prompt('Enter header text:', 'Confidential') || '';
        if (text) {
          const options = {
            pages: command.pages.map(p => p - 1),
            zone: 'header' as const,
            text,
            align: 'center' as const,
            marginX: 50,
            marginY: 30,
            fontSize: 12,
            color: '#000000',
            opacity: 1,
            fileName: 'document.pdf',
            now: new Date(),
            enablePageNumberToken: false,
            enableFileNameToken: false,
            enableDateToken: false,
          };
          const nextBytes = await PdfEditAdapter.addHeaderFooterText(workingBytes, options);
          await applyNewBytes(nextBytes, command.pages[0]);
        }
        break;
      }
      default:
        // eslint-disable-next-line no-console
        console.log('Command not yet fully implemented', command);
    }
    return { success: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Command failed', error);
    return { success: false, error };
  }
};
