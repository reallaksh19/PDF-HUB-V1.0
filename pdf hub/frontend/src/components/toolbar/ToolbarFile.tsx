import React from 'react';
import { Button } from '@/components/ui/Button';
import { FolderOpen, Save, Download, FileOutput } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { FileAdapter } from '@/adapters/file/FileAdapter';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { useSessionStore } from '@/core/session/store';
import { useAnnotationStore } from '@/core/annotations/store';
import { error as logError, warn } from '@/core/logger/service';

export const ToolbarFile: React.FC = () => {
  const {
    openDocument,
    workingBytes,
    fileName,
    saveHandle,
    setSaveHandle,
    setDirty,
  } = useSessionStore();

  const { annotations } = useAnnotationStore();

  const handleOpen = async () => {
    try {
      const [picked] = await FileAdapter.pickPdfFiles(false);
      if (!picked) {
        return;
      }

      const pageCount = await PdfEditAdapter.countPages(picked.bytes);
      const documentKey = await FileAdapter.hashBytes(picked.bytes);

      openDocument({
        documentKey,
        fileName: picked.name,
        bytes: picked.bytes,
        pageCount,
        saveHandle: picked.handle ?? null,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      logError('session', 'Failed to open PDF from toolbar', { error: String(err) });
    }
  };

  const handleSave = async () => {
    if (!workingBytes || !fileName) {
      return;
    }
    try {
      const nextHandle = await FileAdapter.savePdfBytes(workingBytes, fileName, saveHandle);
      if (nextHandle) {
        setSaveHandle(nextHandle);
      }
      setDirty(false);
    } catch (err) {
      if (saveHandle && isHandleAccessError(err)) {
        warn('session', 'Existing save handle became invalid, retrying with Save As flow', {
          error: String(err),
        });
        const nextHandle = await FileAdapter.savePdfBytes(workingBytes, fileName, null);
        if (nextHandle) {
          setSaveHandle(nextHandle);
        }
        setDirty(false);
        return;
      }
      logError('session', 'Failed to save PDF', { error: String(err), fileName });
    }
  };

  const handleExport = async () => {
    if (!workingBytes || !fileName) {
      return;
    }
    try {
      const exported = await PdfEditAdapter.exportWithAnnotations(workingBytes, annotations);
      const exportName = fileName.replace(/\.pdf$/i, '') + '-annotated.pdf';
      await FileAdapter.savePdfBytes(exported, exportName, null);
    } catch (err) {
      logError('session', 'Failed to export annotated PDF', { error: String(err), fileName });
    }
  };

  const handleDownload = () => {
    if (!workingBytes || !fileName) {
      return;
    }
    FileAdapter.downloadBytes(workingBytes, fileName);
  };

  return (
    <div className="flex items-center space-x-1">
      <Tooltip content="Open PDF">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpen}>
          <FolderOpen className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Save">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave} disabled={!workingBytes}>
          <Save className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Export flattened PDF">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport} disabled={!workingBytes}>
          <FileOutput className="w-4 h-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Download current PDF">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload} disabled={!workingBytes}>
          <Download className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );
};

function isHandleAccessError(err: unknown): boolean {
  if (!(err instanceof DOMException)) {
    return false;
  }
  return err.name === 'NotReadableError' || err.name === 'NotAllowedError' || err.name === 'NotFoundError';
}
