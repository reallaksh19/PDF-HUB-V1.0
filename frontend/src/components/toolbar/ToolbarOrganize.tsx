import React, { useState } from 'react';
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
  PlaySquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { FileAdapter } from '@/adapters/file/FileAdapter';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { useSessionStore } from '@/core/session/store';
import { InsertBlankPageDialog } from '../dialogs/InsertBlankPageDialog';
import { ReplacePageDialog } from '../dialogs/ReplacePageDialog';
import { BatchRunDialog } from '../dialogs/BatchRunDialog';
import { runMacroBatch } from '@/core/macro/batchRunner';
import { BUILTIN_MACROS } from '@/core/macro/builtins';

export const ToolbarOrganize: React.FC = () => {

  const [isBlankPageDialogOpen, setIsBlankPageDialogOpen] = useState(false);
  const [isReplacePageDialogOpen, setIsReplacePageDialogOpen] = useState(false);
  const [isBatchRunDialogOpen, setIsBatchRunDialogOpen] = useState(false);
  const [replaceDonorBytes, setReplaceDonorBytes] = useState<Uint8Array | null>(null);
  const [replaceDonorCount, setReplaceDonorCount] = useState<number>(1);

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

  const handleInsertBlankPage = () => {
    if (!workingBytes) return;
    setIsBlankPageDialogOpen(true);
  };

  const confirmInsertBlankPage = async (preset: string, placement: string) => {
    if (!workingBytes) return;
    let size: { width: number; height: number } = { width: 595, height: 842 };
    if (preset === 'letter') {
      size = { width: 612, height: 792 };
    }
    if (preset === 'match') {
      size = await PdfEditAdapter.getPageSize(workingBytes, viewState.currentPage - 1);
    }

    const atIndex = placement === 'before' ? viewState.currentPage - 1 : viewState.currentPage;
    const next = await PdfEditAdapter.insertBlankPage(workingBytes, atIndex, size);
    await applyNewBytes(next, atIndex + 1);
  };

  const handleReplacePage = async () => {
    if (!workingBytes) return;
    const [donor] = await FileAdapter.pickPdfFiles(false);
    if (!donor) return;
    const donorCount = await PdfEditAdapter.countPages(donor.bytes);
    setReplaceDonorBytes(donor.bytes);
    setReplaceDonorCount(donorCount);
    setIsReplacePageDialogOpen(true);
  };

  const confirmReplacePage = async (donorPage: number) => {
    if (!workingBytes || !replaceDonorBytes) return;
    const safeDonorPage = Math.max(1, Math.min(replaceDonorCount, donorPage));
    const next = await PdfEditAdapter.replacePage(
      workingBytes,
      viewState.currentPage - 1,
      replaceDonorBytes,
      safeDonorPage - 1,
    );
    await applyNewBytes(next, viewState.currentPage);
    setReplaceDonorBytes(null);
  };

  const handleBatchRun = () => {
    setIsBatchRunDialogOpen(true);
  };

  const confirmBatchRun = async (recipeId: string) => {
    const files = await FileAdapter.pickPdfFiles(true);
    if (!files.length) return;
    const recipe = BUILTIN_MACROS[recipeId];
    if (!recipe) return;

    const report = await runMacroBatch({
      files,
      recipe,
      continueOnError: true
    });

    const reportJson = JSON.stringify(report, null, 2);
    const reportBytes = new TextEncoder().encode(reportJson);
    const blob = new Blob([reportBytes], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <InsertBlankPageDialog
        isOpen={isBlankPageDialogOpen}
        onClose={() => setIsBlankPageDialogOpen(false)}
        onConfirm={confirmInsertBlankPage}
      />
      <ReplacePageDialog
        isOpen={isReplacePageDialogOpen}
        onClose={() => {
          setIsReplacePageDialogOpen(false);
          setReplaceDonorBytes(null);
        }}
        onConfirm={confirmReplacePage}
        maxPages={replaceDonorCount}
      />
      <BatchRunDialog
        isOpen={isBatchRunDialogOpen}
        onClose={() => setIsBatchRunDialogOpen(false)}
        onConfirm={confirmBatchRun}
      />
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

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />

      <Tooltip content="Batch Run Recipe">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBatchRun}>
          <PlaySquare className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
    </>
  );
};
