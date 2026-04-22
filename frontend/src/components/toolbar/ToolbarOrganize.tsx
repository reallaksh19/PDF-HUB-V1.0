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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Modal } from '@/components/ui/Modal';
import { FileAdapter, type PickedPdfFile } from '@/adapters/file/FileAdapter';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { useSessionStore } from '@/core/session/store';

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

  const [isInsertBlankModalOpen, setIsInsertBlankModalOpen] = useState(false);
  const [insertBlankSize, setInsertBlankSize] = useState<'match' | 'a4' | 'letter'>('match');
  const [insertBlankPlacement, setInsertBlankPlacement] = useState<'before' | 'after'>('after');

  const [isReplacePageModalOpen, setIsReplacePageModalOpen] = useState(false);
  const [replaceDonorFile, setReplaceDonorFile] = useState<PickedPdfFile | null>(null);
  const [replaceDonorPage, setReplaceDonorPage] = useState<number>(1);
  const [replaceDonorMaxPages, setReplaceDonorMaxPages] = useState<number>(1);

  const handleInsertBlankPageClick = () => {
    if (!workingBytes) return;
    setIsInsertBlankModalOpen(true);
  };

  const confirmInsertBlankPage = async () => {
    if (!workingBytes) return;
    setIsInsertBlankModalOpen(false);

    let size = { width: 595, height: 842 };
    if (insertBlankSize === 'letter') {
      size = { width: 612, height: 792 };
    }
    if (insertBlankSize === 'match') {
      size = await PdfEditAdapter.getPageSize(workingBytes, viewState.currentPage - 1);
    }

    const atIndex = insertBlankPlacement === 'before' ? viewState.currentPage - 1 : viewState.currentPage;
    const next = await PdfEditAdapter.insertBlankPage(workingBytes, atIndex, size);
    await applyNewBytes(next, atIndex + 1);
  };

  const handleReplacePageClick = async () => {
    if (!workingBytes) return;

    const [donor] = await FileAdapter.pickPdfFiles(false);
    if (!donor) return;

    const donorCount = await PdfEditAdapter.countPages(donor.bytes);
    setReplaceDonorFile(donor);
    setReplaceDonorMaxPages(donorCount);
    setReplaceDonorPage(1);
    setIsReplacePageModalOpen(true);
  };

  const confirmReplacePage = async () => {
    if (!workingBytes || !replaceDonorFile) return;
    setIsReplacePageModalOpen(false);

    const safeDonorPage = Math.max(1, Math.min(replaceDonorMaxPages, replaceDonorPage));
    const next = await PdfEditAdapter.replacePage(
      workingBytes,
      viewState.currentPage - 1,
      replaceDonorFile.bytes,
      safeDonorPage - 1,
    );

    await applyNewBytes(next, viewState.currentPage);
    setReplaceDonorFile(null);
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
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReplacePageClick} disabled={!workingBytes}>
          <Replace className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Insert blank page">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleInsertBlankPageClick} disabled={!workingBytes}>
          <FilePlus2 className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Split selected pages into a new PDF and remove them here">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSplitOut} disabled={!workingBytes}>
          <Split className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Modal
        isOpen={isInsertBlankModalOpen}
        onClose={() => setIsInsertBlankModalOpen(false)}
        title="Insert Blank Page"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Page Size</label>
            <select
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
              value={insertBlankSize}
              onChange={(e) => setInsertBlankSize(e.target.value as 'match' | 'a4' | 'letter')}
            >
              <option value="match">Match Current Page</option>
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Placement</label>
            <select
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
              value={insertBlankPlacement}
              onChange={(e) => setInsertBlankPlacement(e.target.value as 'before' | 'after')}
            >
              <option value="before">Before Current Page</option>
              <option value="after">After Current Page</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsInsertBlankModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmInsertBlankPage}>Insert</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReplacePageModalOpen}
        onClose={() => setIsReplacePageModalOpen(false)}
        title="Replace Page"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Donor file: <span className="font-medium text-slate-700 dark:text-slate-300">{replaceDonorFile?.name}</span> ({replaceDonorMaxPages} pages)
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Donor Page Number</label>
            <input
              type="number"
              min={1}
              max={replaceDonorMaxPages}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm"
              value={replaceDonorPage}
              onChange={(e) => setReplaceDonorPage(parseInt(e.target.value, 10) || 1)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsReplacePageModalOpen(false)}>Cancel</Button>
            <Button onClick={confirmReplacePage}>Replace</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

