import React from 'react';
import {
  Layers,
  PlusSquare,
  RotateCw,
  Scissors,
  CopyPlus,
  Replace,
  FilePlus2,
  Trash2,
  Split,
  Files,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { FileAdapter } from '@/adapters/file/FileAdapter';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { useSessionStore } from '@/core/session/store';
import { BUILTIN_MACROS } from '@/core/macro/builtins';
import { runMacroRecipeAcrossFiles } from '@/core/macro/batchRunner';

export const ToolbarOrganize: React.FC = () => {
  const {
    workingBytes,
    pageCount,
    selectedPages,
    viewState,
    replaceWorkingCopy,
    setPage,
    clearSelectedPages,
  } = useSessionStore();

  const activePages = selectedPages.length > 0 ? selectedPages : [viewState.currentPage];
  const activeIndices = activePages.map((page) => page - 1);

  const applyNewBytes = async (bytes: Uint8Array, nextPage?: number) => {
    const nextCount = await PdfEditAdapter.countPages(bytes);
    replaceWorkingCopy(bytes, nextCount);
    clearSelectedPages();
    if (nextPage) {
      setPage(nextPage);
    }
  };

  const handleMerge = async () => {
    if (!workingBytes) {
      return;
    }
    const files = await FileAdapter.pickPdfFiles(true);
    if (!files.length) {
      return;
    }
    const merged = await PdfEditAdapter.merge(workingBytes, files.map((file) => file.bytes));
    await applyNewBytes(merged);
  };

  const handleExtract = async () => {
    if (!workingBytes || activeIndices.length === 0) {
      return;
    }
    const extracted = await PdfEditAdapter.extractPages(workingBytes, activeIndices);
    const name = `extract-pages-${activePages.join('-')}.pdf`;
    await FileAdapter.savePdfBytes(extracted, name, null);
  };

  const handleInsertFromPdf = async () => {
    if (!workingBytes) {
      return;
    }

    const [picked] = await FileAdapter.pickPdfFiles(false);
    if (!picked) {
      return;
    }

    const inserted = await PdfEditAdapter.insertAt(
      workingBytes,
      picked.bytes,
      viewState.currentPage - 1,
    );
    await applyNewBytes(inserted, viewState.currentPage);
  };

  const handleDeletePages = async () => {
    if (!workingBytes || activeIndices.length === 0) {
      return;
    }
    if (activeIndices.length >= pageCount) {
      return;
    }
    const next = await PdfEditAdapter.removePages(workingBytes, activeIndices);
    await applyNewBytes(next, 1);
  };

  const handleSplitOut = async () => {
    if (!workingBytes || activeIndices.length === 0) {
      return;
    }
    const extracted = await PdfEditAdapter.extractPages(workingBytes, activeIndices);
    const remaining = await PdfEditAdapter.removePages(workingBytes, activeIndices);
    const name = `split-pages-${activePages.join('-')}.pdf`;
    await FileAdapter.savePdfBytes(extracted, name, null);
    await applyNewBytes(remaining, 1);
  };

  const handleDuplicatePages = async () => {
    if (!workingBytes || activeIndices.length === 0) {
      return;
    }
    const next = await PdfEditAdapter.duplicatePages(workingBytes, activeIndices);
    await applyNewBytes(next, viewState.currentPage);
  };

  const handleRotatePages = async () => {
    if (!workingBytes || activeIndices.length === 0) {
      return;
    }
    const next = await PdfEditAdapter.rotatePages(workingBytes, activeIndices, 90);
    await applyNewBytes(next, viewState.currentPage);
  };

  const handleInsertBlankPage = async () => {
    if (!workingBytes) {
      return;
    }

    const preset = (window.prompt('Blank page size: match / a4 / letter', 'match') || 'match')
      .trim()
      .toLowerCase();

    let size = { width: 595, height: 842 };
    if (preset === 'letter') {
      size = { width: 612, height: 792 };
    }
    if (preset === 'match') {
      size = await PdfEditAdapter.getPageSize(workingBytes, viewState.currentPage - 1);
    }

    const where = (window.prompt('Insert blank page before or after current? before / after', 'after') || 'after')
      .trim()
      .toLowerCase();

    const atIndex = where === 'before' ? viewState.currentPage - 1 : viewState.currentPage;
    const next = await PdfEditAdapter.insertBlankPage(workingBytes, atIndex, size);
    await applyNewBytes(next, atIndex + 1);
  };

  const handleReplacePage = async () => {
    if (!workingBytes) {
      return;
    }
    const [donor] = await FileAdapter.pickPdfFiles(false);
    if (!donor) {
      return;
    }

    const donorCount = await PdfEditAdapter.countPages(donor.bytes);
    const donorPage = Number(
      window.prompt(`Donor page number (1-${donorCount})`, '1') || '1',
    );

    const safeDonorPage = Math.max(1, Math.min(donorCount, donorPage));
    const next = await PdfEditAdapter.replacePage(
      workingBytes,
      viewState.currentPage - 1,
      donor.bytes,
      safeDonorPage - 1,
    );

    await applyNewBytes(next, viewState.currentPage);
  };

  const handleBatchRun = async () => {
    const files = await FileAdapter.pickPdfFiles(true);
    if (!files.length) {
      return;
    }

    const selected = (
      window.prompt(
        'Batch recipe: pageNumbers | footer | header | batchText',
        'pageNumbers',
      ) || 'pageNumbers'
    )
      .trim()
      .toLowerCase();

    let recipe = BUILTIN_MACROS.add_page_numbers_footer;
    if (selected === 'footer') {
      recipe = BUILTIN_MACROS.add_file_date_footer_selected;
    }
    if (selected === 'header') {
      recipe = BUILTIN_MACROS.add_filename_header_selected;
    }
    if (selected === 'batchtext') {
      const text = window.prompt('Batch text', 'REVIEW COPY') ?? 'REVIEW COPY';
      recipe = {
        ...BUILTIN_MACROS.batch_text_selected,
        steps: [
          {
            op: 'draw_text_on_pages',
            selector: { mode: 'all' },
            text,
            x: 36,
            y: 36,
            fontSize: 16,
            color: '#b91c1c',
            opacity: 0.9,
            align: 'left',
          },
        ],
      };
    }

    await runMacroRecipeAcrossFiles(
      recipe,
      files.map((file) => ({ name: file.name, bytes: file.bytes })),
      { saveOutputs: true, suffix: '-processed' },
    );
  };

  return (
    <div className="flex items-center space-x-1">
      <Tooltip content="Merge PDFs">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMerge} disabled={!workingBytes}>
          <Layers className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Extract selected/current pages">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExtract} disabled={!workingBytes}>
          <Scissors className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Insert pages from another PDF before current page">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleInsertFromPdf} disabled={!workingBytes}>
          <PlusSquare className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Delete selected/current pages">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleDeletePages}
          disabled={!workingBytes || activeIndices.length >= pageCount}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Duplicate selected/current pages">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDuplicatePages} disabled={!workingBytes}>
          <CopyPlus className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Rotate selected/current pages">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRotatePages} disabled={!workingBytes}>
          <RotateCw className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Replace current page from another PDF">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReplacePage} disabled={!workingBytes}>
          <Replace className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Insert blank page">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleInsertBlankPage} disabled={!workingBytes}>
          <FilePlus2 className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Split selected pages into a new PDF and remove them here">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSplitOut} disabled={!workingBytes}>
          <Split className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Run one macro recipe on several files">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBatchRun}>
          <Files className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
};

