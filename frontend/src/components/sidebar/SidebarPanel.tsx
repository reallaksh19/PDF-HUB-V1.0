import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '@/core/editor/store';
import { useAnnotationStore } from '@/core/annotations/store';
import { useSessionStore } from '@/core/session/store';
import { error as logError } from '@/core/logger/service';
import { loadAppBookmarks, saveAppBookmarks } from '@/core/bookmarks/persistence';
import type { AppBookmark } from '@/core/bookmarks/types';
import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';
import { MacrosSidebar } from '@/components/sidebar/MacrosSidebar';
import { useSearchStore } from '@/core/search/store';
import { SearchIndexer } from '@/core/search/indexer';
import { createOverlayReplaceAnnotation } from '@/core/search/overlayReplace';
import {
  Layers,
  Bookmark,
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const SidebarPanel: React.FC = () => {
  const { sidebarTab, leftPanelWidth, setLeftPanelWidth } = useEditorStore();
  const [previousWidth, setPreviousWidth] = useState(20);

  const isCollapsed = leftPanelWidth <= 0.1;

  const toggleCollapse = () => {
    if (isCollapsed) {
      setLeftPanelWidth(previousWidth < 10 ? 20 : previousWidth);
    } else {
      setPreviousWidth(leftPanelWidth);
      setLeftPanelWidth(0);
    }
  };

  const getPanelTitle = () => {
    switch (sidebarTab) {
      case 'thumbnails':
        return 'Pages';
      case 'bookmarks':
        return 'Bookmarks';
      case 'comments':
        return 'Comments';
      case 'search':
        return 'Search';
      case 'macros':
        return 'Macros';
      default:
        return 'Panel';
    }
  };

  if (isCollapsed) {
    return (
      <div className="absolute top-4 left-4 z-10" style={{ transform: 'translateX(3rem)' }}>
        <Button
          data-testid="sidebar-collapse-btn"
          variant="secondary"
          size="icon"
          onClick={toggleCollapse}
          className="shadow-md rounded-full h-8 w-8"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {getPanelTitle()}
        </h2>
        <Button
          data-testid="sidebar-collapse-btn"
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mr-2"
          onClick={toggleCollapse}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto relative">
        {sidebarTab === 'thumbnails' && <ThumbnailSidebar />}
        {sidebarTab === 'bookmarks' && <BookmarksSidebar />}
        {sidebarTab === 'comments' && <CommentsSidebar />}
        {sidebarTab === 'search' && <SearchPanelStub />}
        {sidebarTab === 'macros' && <MacrosSidebar />}
      </div>
    </div>
  );
};

interface ThumbItem {
  pageNumber: number;
  imageUrl: string;
}

const ThumbnailSidebar: React.FC = () => {
  const {
    workingBytes,
    viewState,
    setPage,
    replaceWorkingCopy,
    selectedPages,
    setSelectedPages,
    toggleSelectedPage,
  } = useSessionStore();

  const [thumbs, setThumbs] = React.useState<ThumbItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [dragPage, setDragPage] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadThumbnails = async () => {
      if (!workingBytes) {
        setThumbs([]);
        return;
      }

      setLoading(true);
      const doc = await PdfRendererAdapter.loadDocument(workingBytes);

      try {
        const nextThumbs: ThumbItem[] = [];
        const concurrency = 4;
        let running = 0;
        let currentIndex = 1;

        await new Promise<void>((resolve) => {
          const processNext = async () => {
            if (cancelled || currentIndex > doc.numPages) {
              if (running === 0) resolve();
              return;
            }

            const pageNumber = currentIndex++;
            running++;

            try {
              const page = await doc.getPage(pageNumber);
              const imageUrl = await PdfRendererAdapter.getThumbnail(page);
              nextThumbs.push({ pageNumber, imageUrl });
            } finally {
              running--;
              processNext();
            }
          };

          for (let i = 0; i < concurrency; i++) {
            processNext();
          }
        });

        if (!cancelled) {
          // Sort because concurrency might resolve out of order
          nextThumbs.sort((a, b) => a.pageNumber - b.pageNumber);
          setThumbs(nextThumbs);
        }
      } finally {
        if (!cancelled) setLoading(false);
        await doc.destroy();
      }
    };

    void loadThumbnails();

    return () => {
      cancelled = true;
    };
  }, [workingBytes]);

  const handleDrop = async (targetPage: number, placement: 'before' | 'after' | 'append' = 'before', e?: React.DragEvent) => {
    if (!workingBytes) return;

    if (e?.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      // Handle external donor drop
      e.preventDefault();
      try {
        setLoading(true);
        const file = e.dataTransfer.files[0];
        if (file.type !== 'application/pdf') {
          throw new Error('Only PDF files can be dropped here.');
        }

        const donorBytes = new Uint8Array(await file.arrayBuffer());
        const atIndex = placement === 'append' ? pageCount : (placement === 'after' ? targetPage : targetPage - 1);

        const nextBytes = await PdfEditAdapter.insertAt(workingBytes, donorBytes, atIndex);
        const nextCount = await PdfEditAdapter.countPages(nextBytes);
        replaceWorkingCopy(nextBytes, nextCount);
        setPage(Math.min(atIndex + 1, nextCount));
      } catch (err) {
        logError('session', 'Failed to parse external donor drop', { error: String(err) });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (dragPage === null) return;

    // Internal reorder
    const pagesToMove = selectedPages.includes(dragPage)
      ? selectedPages.map(p => p - 1)
      : [dragPage - 1];

    if (pagesToMove.includes(targetPage - 1)) {
      setDragPage(null);
      return;
    }

    const nextBytes = await PdfEditAdapter.movePagesAsBlock(
      workingBytes,
      pagesToMove,
      targetPage - 1,
      placement
    );
    const nextCount = await PdfEditAdapter.countPages(nextBytes);
    replaceWorkingCopy(nextBytes, nextCount);
    setPage(targetPage);
    setSelectedPages([]);
    setDragPage(null);
  };

  const handleSelect = (
    event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
    pageNumber: number,
  ) => {
    if (event.metaKey || event.ctrlKey) {
      toggleSelectedPage(pageNumber);
    } else if (event.shiftKey && selectedPages.length > 0) {
      // Shift selection: Range from last selected to current
      const lastSelected = selectedPages[selectedPages.length - 1];
      const start = Math.min(lastSelected, pageNumber);
      const end = Math.max(lastSelected, pageNumber);
      const newSelection = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      setSelectedPages(Array.from(new Set([...selectedPages, ...newSelection])));
    } else {
      setSelectedPages([pageNumber]);
      setPage(pageNumber);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>, pageNumber: number) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!workingBytes) return;
      const pagesToDelete = selectedPages.includes(pageNumber) ? selectedPages : [pageNumber];
      const nextBytes = await PdfEditAdapter.removePages(workingBytes, pagesToDelete.map(p => p - 1));
      const nextCount = await PdfEditAdapter.countPages(nextBytes);
      replaceWorkingCopy(nextBytes, nextCount);
      setSelectedPages([]);
      setPage(Math.min(pageNumber, nextCount));
    }
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
    event.preventDefault();
    if (!selectedPages.includes(pageNumber)) {
      setSelectedPages([pageNumber]);
      setPage(pageNumber);
    }
    // TODO: implement context menu logic using a specialized dropdown component or system overlay
    // The exact UI for this is generally built via Radix DropdownMenu or custom overlay in production,
    // which requires complex layout handling outside typical simple divs.
    // For this context, standard UI patterns dictates dispatching custom event or using a global menu hook.
  };

  if (!workingBytes) {
    return (
      <FeaturePlaceholder
        name="Pages"
        description="Open a PDF to generate thumbnails and reorder pages."
        icon={<Layers />}
      />
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="text-xs text-slate-500 dark:text-slate-400">
        Ctrl/Cmd-click to multi-select pages.
      </div>

      {loading && <div className="text-sm text-slate-500">Generating thumbnails...</div>}

      {thumbs.map((thumb) => {
        const active = thumb.pageNumber === viewState.currentPage;
        const selected = selectedPages.includes(thumb.pageNumber);

        return (
          <div key={thumb.pageNumber} className="relative group">
            {/* Drop zone: Before */}
            <div
              className="absolute -top-1.5 left-0 right-0 h-3 z-10 opacity-0 hover:opacity-100 bg-blue-500/20 rounded cursor-copy transition-opacity"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); void handleDrop(thumb.pageNumber, 'before', e); }}
            />

            <div
              tabIndex={0}
              draggable
              onDragStart={() => setDragPage(thumb.pageNumber)}
              onClick={(event) => handleSelect(event, thumb.pageNumber)}
              onKeyDown={(event) => void handleKeyDown(event, thumb.pageNumber)}
              onContextMenu={(event) => handleContextMenu(event, thumb.pageNumber)}
              className={`rounded-lg border p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                selected
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                  : active
                  ? 'border-slate-400 bg-slate-50 dark:bg-slate-900'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Page {thumb.pageNumber}
                </span>
              </div>
              {selected ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white">
                  Selected
                </span>
              ) : active ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-white">
                  Current
                </span>
              ) : null}
            </div>

            <div className="bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
              <img
                src={thumb.imageUrl}
                alt={`Thumbnail for page ${thumb.pageNumber}`}
                className="block w-full h-auto"
                loading="lazy"
              />
            </div>
            </div>
            {/* Drop zone: After (only shown on last element usually, or handle general between) */}
            {thumb.pageNumber === pageCount && (
              <div
                className="absolute -bottom-1.5 left-0 right-0 h-3 z-10 opacity-0 hover:opacity-100 bg-blue-500/20 rounded cursor-copy transition-opacity"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); void handleDrop(thumb.pageNumber, 'after', e); }}
              />
            )}
          </div>
        );
      })}

      {/* Global Append Drop Zone */}
      <div
        className="w-full h-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); void handleDrop(pageCount, 'append', e); }}
      >
        Drag here to append to end
      </div>
    </div>
  );
};

const BookmarksSidebar: React.FC = () => {
  const { workingBytes, documentKey, viewState, setPage } = useSessionStore();

  const [nativeBookmarks, setNativeBookmarks] = React.useState<
    Array<{ id: string; title: string; pageNumber: number | null; depth: number }>
  >([]);
  const [customBookmarks, setCustomBookmarks] = React.useState<AppBookmark[]>([]);
  const [title, setTitle] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!workingBytes) {
        setNativeBookmarks([]);
        return;
      }

      const doc = await PdfRendererAdapter.loadDocument(workingBytes);
      try {
        const outline = await PdfRendererAdapter.getOutlineFlat(doc);
        if (!cancelled) setNativeBookmarks(outline);
      } finally {
        await doc.destroy();
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [workingBytes]);

  React.useEffect(() => {
    const load = async () => {
      if (!documentKey) {
        setCustomBookmarks([]);
        return;
      }
      const bookmarks = await loadAppBookmarks(documentKey);
      setCustomBookmarks(bookmarks);
    };
    void load();
  }, [documentKey]);

  const persistCustomBookmarks = async (next: AppBookmark[]) => {
    setCustomBookmarks(next);
    if (documentKey) {
      await saveAppBookmarks(documentKey, next);
    }
  };

  const addBookmark = async () => {
    if (!documentKey) return;
    const next: AppBookmark = {
      id: uuidv4(),
      title: title.trim() || `Page ${viewState.currentPage}`,
      pageNumber: viewState.currentPage,
      createdAt: Date.now(),
    };
    await persistCustomBookmarks([...customBookmarks, next]);
    setTitle('');
  };

  const removeBookmark = async (id: string) => {
    await persistCustomBookmarks(customBookmarks.filter((bookmark) => bookmark.id !== id));
  };

  if (!workingBytes) {
    return (
      <FeaturePlaceholder
        name="Bookmarks"
        description="Open a PDF to view outline and add app bookmarks."
        icon={<Bookmark />}
      />
    );
  }

  return (
    <div className="p-3 space-y-4">
      <div className="space-y-2 rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Add bookmark for current page
        </div>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={`Page ${viewState.currentPage}`}
          className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        />
        <Button size="sm" onClick={() => void addBookmark()}>
          <Plus className="w-4 h-4 mr-1" />
          Add Bookmark
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          My bookmarks
        </div>
        {customBookmarks.length === 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            No custom bookmarks yet.
          </div>
        )}
        {customBookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 flex items-start justify-between gap-3"
          >
            <button className="text-left flex-1" onClick={() => setPage(bookmark.pageNumber)}>
              <div className="text-sm text-slate-800 dark:text-slate-100">{bookmark.title}</div>
              <div className="text-xs text-slate-500">Page {bookmark.pageNumber}</div>
            </button>
            <Button variant="ghost" size="icon" onClick={() => void removeBookmark(bookmark.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Native outline
        </div>
        {nativeBookmarks.length === 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            No native outline/bookmarks found.
          </div>
        )}
        {nativeBookmarks.map((bookmark) => (
          <button
            key={bookmark.id}
            className="w-full text-left rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ paddingLeft: `${12 + bookmark.depth * 14}px` }}
            onClick={() => {
              if (bookmark.pageNumber) setPage(bookmark.pageNumber);
            }}
          >
            <div className="text-sm text-slate-800 dark:text-slate-100">{bookmark.title}</div>
            <div className="text-xs text-slate-500">
              {bookmark.pageNumber ? `Page ${bookmark.pageNumber}` : 'Destination unavailable'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const CommentsSidebar: React.FC = () => {
  const { annotations, activeAnnotationId, setActiveAnnotationId } = useAnnotationStore();
  const { setPage } = useSessionStore();

  if (annotations.length === 0) {
    return (
      <FeaturePlaceholder
        name="Comments"
        description="Create annotations on the page to see them listed here."
        icon={<MessageSquare />}
      />
    );
  }

  return (
    <div className="p-3 space-y-2">
      {annotations
        .slice()
        .sort((a, b) => a.pageNumber - b.pageNumber || b.updatedAt - a.updatedAt)
        .map((annotation) => {
          const selected = annotation.id === activeAnnotationId;
          const text =
            typeof annotation.data.text === 'string' && annotation.data.text.trim()
              ? annotation.data.text
              : annotation.type.toUpperCase();

          return (
            <button
              key={annotation.id}
              className={`w-full text-left rounded-lg border p-3 ${
                selected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
              }`}
              onClick={() => {
                setActiveAnnotationId(annotation.id);
                setPage(annotation.pageNumber);
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Page {annotation.pageNumber} · {annotation.type}
              </div>
              <div className="mt-1 text-sm text-slate-800 dark:text-slate-100 truncate">{text}</div>
            </button>
          );
        })}
    </div>
  );
};

const SearchPanelStub: React.FC = () => {
  const { workingBytes, documentKey, setPage } = useSessionStore();
  const { hits, activeHitIndex, setHits, nextHit, prevHit } = useSearchStore();

  const [query, setQuery] = React.useState('');
  const [replaceText, setReplaceText] = React.useState('');
  const [caseSensitive, setCaseSensitive] = React.useState(false);
  const [wholeWord, setWholeWord] = React.useState(false);
  const [useRegex, setUseRegex] = React.useState(false);

  const handleSearch = () => {
    if (!documentKey) return;
    const pagesText = SearchIndexer.getCache(documentKey);
    if (!pagesText) {
      console.warn("Index not built yet.");
      return;
    }

    const newHits = SearchIndexer.search(pagesText, query, {
      caseSensitive,
      wholeWord,
      useRegex
    });

    setHits(newHits);
    if (newHits.length > 0) {
      setPage(newHits[0].pageNumber);
    }
  };

  const handleNext = () => {
    nextHit();
    const nextIndex = (activeHitIndex + 1) % hits.length;
    if (hits[nextIndex]) setPage(hits[nextIndex].pageNumber);
  };

  const handlePrev = () => {
    prevHit();
    const prevIndex = (activeHitIndex - 1 + hits.length) % hits.length;
    if (hits[prevIndex]) setPage(hits[prevIndex].pageNumber);
  };

  const handleReplaceCurrent = () => {
    const activeHit = hits[activeHitIndex];
    if (!activeHit) return;

    // Create opaque annotation
    createOverlayReplaceAnnotation(activeHit, replaceText);

    // After replacing, usually we move to the next hit
    handleNext();
  };

  const handleReplaceAll = () => {
    if (hits.length === 0) return;
    hits.forEach((hit) => {
       createOverlayReplaceAnnotation(hit, replaceText);
    });
    // Normally clear hits or update index after a bulk op
  };

  if (!workingBytes) {
    return (
      <FeaturePlaceholder
        name="Search"
        description="Open a PDF to search for text."
        icon={<Search />}
      />
    );
  }

  return (
    <div className="p-3 space-y-4">
       <div className="space-y-3">
         <label className="text-xs text-slate-500 block">
            Search Term
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              placeholder="Search document..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
         </label>

         <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
            Match Case
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} />
            Whole Word
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} />
            RegEx
          </label>
         </div>

         <Button className="w-full justify-center" onClick={handleSearch} disabled={!query}>Search</Button>

         {hits.length > 0 && (
           <>
             <div className="text-xs text-center text-slate-500">
               Showing {activeHitIndex + 1} of {hits.length} matches
             </div>
             <div className="flex gap-2">
               <Button className="w-full justify-center" onClick={handlePrev}>Previous</Button>
               <Button className="w-full justify-center" onClick={handleNext}>Next</Button>
             </div>

             <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-800">
               <label className="text-xs text-slate-500 block">
                  Replace With
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    placeholder="New text..."
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                  />
               </label>
               <div className="flex gap-2">
                 <Button variant="secondary" className="w-full justify-center" onClick={handleReplaceCurrent}>Replace</Button>
                 <Button variant="secondary" className="w-full justify-center" onClick={handleReplaceAll}>Replace All</Button>
               </div>
             </div>
           </>
         )}
       </div>
    </div>
  );
};
