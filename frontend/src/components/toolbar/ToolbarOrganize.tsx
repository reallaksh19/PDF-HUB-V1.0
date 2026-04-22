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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { FileAdapter } from '@/adapters/file/FileAdapter';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { useSessionStore } from '@/core/session/store';
import { dispatchCommand } from '@/core/commands/dispatch';
import { useHistoryStore } from '@/core/document-history/store';
import { Undo, Redo } from 'lucide-react';

export const ToolbarOrganize: React.FC = () => {
  const {
    workingBytes,
    pageCount,
    selectedPages,
    viewState,
    setPage,
    clearSelectedPages,
  } = useSessionStore();

  const historyStore = useHistoryStore();

  const activePages = selectedPages.length > 0 ? selectedPages : [viewState.currentPage];
  const activeIndices = activePages.map((page) => page - 1);

  const applyPostCommand = (nextPage?: number) => {
    clearSelectedPages();
    if (nextPage) {
      setPage(nextPage);
    }
  };

  const handleMerge = async () => {
    if (!workingBytes) return;
    const files = await FileAdapter.pickPdfFiles(true);
    if (!files.length) return;

    const result = await dispatchCommand({
      source: 'toolbar',
      workingBytes,
      command: {
        type: 'MERGE_PDF',
        additionalBytes: files.map(f => f.bytes)
      }
    });
    if (result.success) applyPostCommand();
  };

  const handleExtract = async () => {
    if (!workingBytes || activeIndices.length === 0) return;
    const extracted = await PdfEditAdapter.extractPages(workingBytes, activeIndices);
    const name = `extract-pages-${activePages.join('-')}.pdf`;
    await FileAdapter.savePdfBytes(extracted, name, null);

    await dispatchCommand({
      source: 'toolbar',
      workingBytes,
      command: { type: 'EXTRACT_PAGES', pageIndices: activeIndices }
    });
  };

  const handleInsertFromPdf = async () => {
    if (!workingBytes) return;
    const [picked] = await FileAdapter.pickPdfFiles(false);
    if (!picked) return;

    const result = await dispatchCommand({
      source: 'toolbar',
      workingBytes,
      command: {
        type: 'INSERT_PAGES',
        atIndex: viewState.currentPage - 1,
        newBytes: picked.bytes
      }
    });
    if (result.success) applyPostCommand(viewState.currentPage);
  };

  const handleDeletePages = async () => {
    if (!workingBytes || activeIndices.length === 0 || activeIndices.length >= pageCount) return;
    const result = await dispatchCommand({
      source: 'toolbar',
      workingBytes,
      command: { type: 'DELETE_PAGES', pageIndices: activeIndices }
    });
    if (result.success) applyPostCommand(1);
  };

  const handleSplitOut = async () => {
    if (!workingBytes || activeIndices.length === 0) return;
    const extracted = await PdfEditAdapter.extractPages(workingBytes, activeIndices);
    const name = `split-pages-${activePages.join('-')}.pdf`;
    await FileAdapter.savePdfBytes(extracted, name, null);

    const result = await dispatchCommand({
      source: 'toolbar',
      workingBytes,
      command: { type: 'SPLIT_PAGES', pageIndices: activeIndices }
    });
    if (result.success) applyPostCommand(1);
  };

  const handleDuplicatePages = async () => {
    if (!workingBytes || activeIndices.length === 0) return;
    const result = await dispatchCommand({
      source: 'toolbar',
      workingBytes,
      command: { type: 'DUPLICATE_PAGES', pageIndices: activeIndices }
    });
    if (result.success) applyPostCommand(viewState.currentPage);
  };

  const handleRotatePages = async () => {
    if (!workingBytes || activeIndices.length === 0) return;
    const result = await dispatchCommand({
      source: 'toolbar',
      workingBytes,
      command: { type: 'ROTATE_PAGES', pageIndices: activeIndices, angle: 90 }
    });
    if (result.success) applyPostCommand(viewState.currentPage);
  };

  const handleInsertBlankPage = async () => {
    if (!workingBytes) return;
    const preset = (window.prompt('Blank page size: match / a4 / letter', 'match') || 'match').trim().toLowerCase();

    let size = { width: 595, height: 842 };
    if (preset === 'letter') size = { width: 612, height: 792 };
    if (preset === 'match') size = await PdfEditAdapter.getPageSize(workingBytes, viewState.currentPage - 1);

    const where = (window.prompt('Insert blank page before or after current? before / after', 'after') || 'after').trim().toLowerCase();
    const atIndex = where === 'before' ? viewState.currentPage - 1 : viewState.currentPage;

    const result = await dispatchCommand({
      source: 'toolbar',
      workingBytes,
      command: { type: 'INSERT_BLANK_PAGE', atIndex, size }
    });
    if (result.success) applyPostCommand(atIndex + 1);
  };

  const handleReplacePage = async () => {
    if (!workingBytes) return;
    const [donor] = await FileAdapter.pickPdfFiles(false);
    if (!donor) return;

    const donorCount = await PdfEditAdapter.countPages(donor.bytes);
    const donorPage = Number(window.prompt(`Donor page number (1-${donorCount})`, '1') || '1');
    const safeDonorPage = Math.max(1, Math.min(donorCount, donorPage));

    const result = await dispatchCommand({
      source: 'toolbar',
      workingBytes,
      command: {
        type: 'REPLACE_PAGE',
        atIndex: viewState.currentPage - 1,
        donorBytes: donor.bytes,
        donorPageIndex: safeDonorPage - 1
      }
    });
    if (result.success) applyPostCommand(viewState.currentPage);
  };

  const handleUndo = () => {
    import('@/core/document-history/transactions').then(({ applyUndo }) => applyUndo());
  };

  const handleRedo = () => {
    import('@/core/document-history/transactions').then(({ applyRedo }) => applyRedo());
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

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

      <Tooltip content="Undo">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={!historyStore.canUndo()}>
          <Undo className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Redo">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={!historyStore.canRedo()}>
          <Redo className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
};

