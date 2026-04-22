import React, { useEffect, useRef } from 'react';
import { dispatchDocumentCommand } from '@/core/commands/dispatch';
import type { DocumentCommand } from '@/core/commands/types';

interface ThumbnailContextMenuProps {
  x: number;
  y: number;
  page: number;
  selectedPages: number[];
  onClose: () => void;
}

export const ThumbnailContextMenu: React.FC<ThumbnailContextMenuProps> = ({
  x,
  y,
  page,
  selectedPages,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetPages = selectedPages.includes(page) ? selectedPages : [page];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleCommand = async (command: DocumentCommand) => {
    await dispatchDocumentCommand({
      source: 'thumbnail-context',
      command,
    });
    onClose();
  };

  // Ensure menu stays within window bounds
  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(y, window.innerHeight - 300), // Approximate max height
    left: Math.min(x, window.innerWidth - 200), // Approximate max width
    zIndex: 1000,
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg py-1 w-48 text-sm"
    >
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        onClick={() => handleCommand({ type: 'rotate-pages', pages: targetPages, degrees: 90 })}
      >
        Rotate
      </button>
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        onClick={() => handleCommand({ type: 'extract-pages', pages: targetPages })}
      >
        Extract
      </button>
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        onClick={() => handleCommand({ type: 'split-pages', pages: targetPages })}
      >
        Split
      </button>
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        onClick={() => handleCommand({ type: 'duplicate-pages', pages: targetPages })}
      >
        Duplicate
      </button>
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-600 dark:text-red-400"
        onClick={() => handleCommand({ type: 'delete-pages', pages: targetPages })}
      >
        Delete
      </button>
      <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        onClick={() => handleCommand({ type: 'insert-blank-page', atIndex: targetPages[0] - 1, size: { width: 595, height: 842 } })}
      >
        Insert blank before
      </button>
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        onClick={() => handleCommand({ type: 'insert-blank-page', atIndex: targetPages[targetPages.length - 1] })}
      >
        Insert blank after
      </button>
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        onClick={() => handleCommand({ type: 'replace-page', pages: targetPages })}
      >
        Replace page
      </button>
      <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        onClick={() => handleCommand({ type: 'add-page-numbers', pages: targetPages })}
      >
        Add page numbers
      </button>
      <button
        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
        onClick={() => handleCommand({ type: 'add-header-footer', pages: targetPages })}
      >
        Add header/footer
      </button>
    </div>
  );
};
