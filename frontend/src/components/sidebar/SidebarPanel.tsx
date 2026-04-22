import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '@/core/editor/store';
import { useAnnotationStore } from '@/core/annotations/store';
import { useSessionStore } from '@/core/session/store';
import { loadAppBookmarks, saveAppBookmarks } from '@/core/bookmarks/persistence';
import type { AppBookmark } from '@/core/bookmarks/types';
import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';
import { MacrosSidebar } from '@/components/sidebar/MacrosSidebar';
import {
  Layers,
  Bookmark,
  Search,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { exportReviewJson, exportReviewText } from '@/core/review/export';
import type { PdfAnnotation, ReplyThreadItem } from '@/core/annotations/types';

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
        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
          const page = await doc.getPage(pageNumber);
          const imageUrl = await PdfRendererAdapter.getThumbnail(page);
          nextThumbs.push({ pageNumber, imageUrl });
        }
        if (!cancelled) setThumbs(nextThumbs);
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

  const handleDrop = async (targetPage: number) => {
    if (!workingBytes || dragPage === null || dragPage === targetPage) return;
    const nextBytes = await PdfEditAdapter.movePage(workingBytes, dragPage - 1, targetPage - 1);
    const nextCount = await PdfEditAdapter.countPages(nextBytes);
    replaceWorkingCopy(nextBytes, nextCount);
    setPage(targetPage);
    setSelectedPages([]);
    setDragPage(null);
  };

  const handleSelect = (
    event: React.MouseEvent<HTMLDivElement>,
    pageNumber: number,
  ) => {
    if (event.metaKey || event.ctrlKey) {
      toggleSelectedPage(pageNumber);
    } else {
      setSelectedPages([pageNumber]);
      setPage(pageNumber);
    }
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
          <div
            key={thumb.pageNumber}
            draggable
            onDragStart={() => setDragPage(thumb.pageNumber)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => void handleDrop(thumb.pageNumber)}
            onClick={(event) => handleSelect(event, thumb.pageNumber)}
            className={`group rounded-lg border p-2 cursor-pointer transition-colors ${
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
        );
      })}
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
  const { hideResolved, setHideResolved } = useEditorStore();
  const { annotations, selectedAnnotationIds, activeAnnotationId, setActiveAnnotationId, updateManyAnnotations, updateAnnotation } = useAnnotationStore();
  const { setPage } = useSessionStore();
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved' | 'rejected'>('all');
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});

  const filteredAnnotations = annotations.filter((ann) => {
    if (filter === 'all') return true;
    const status = ann.data.reviewStatus || 'open';
    return status === filter;
  });

  const sortedAnnotations = filteredAnnotations.slice().sort((a, b) => a.pageNumber - b.pageNumber || b.updatedAt - a.updatedAt);

  const handleBulkAction = (status: 'open' | 'resolved' | 'rejected') => {
    if (selectedAnnotationIds.length === 0) return;
    const updates = selectedAnnotationIds.map((id) => ({
      id,
      data: {
        data: {
          ...(annotations.find(a => a.id === id)?.data || {}),
          reviewStatus: status
        }
      } as Partial<PdfAnnotation>
    }));
    updateManyAnnotations(updates);
  };

  const handleReply = (annId: string) => {
    const text = replyText[annId]?.trim();
    if (!text) return;

    const ann = annotations.find(a => a.id === annId);
    if (!ann) return;

    const replies: ReplyThreadItem[] = Array.isArray(ann.data.replies) ? [...ann.data.replies] : [];
    replies.push({
      id: uuidv4(),
      text,
      author: 'System',
      createdAt: Date.now()
    });

    updateAnnotation(annId, {
      data: {
        ...ann.data,
        replies
      }
    });

    setReplyText(prev => ({ ...prev, [annId]: '' }));
  };

  return (
    <div className="p-3 flex flex-col h-full space-y-4">
      <div className="space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <label className="flex items-center text-xs space-x-2 text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hideResolved}
              onChange={(e) => setHideResolved(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Hide resolved on canvas</span>
          </label>
        </div>

        <select
          className="w-full text-sm rounded-md border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 px-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'open' | 'resolved' | 'rejected')}
        >
          <option value="all">All Comments</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>

        {selectedAnnotationIds.length > 0 && (
          <div className="flex gap-1">
            <Button variant="secondary" size="sm" onClick={() => handleBulkAction('resolved')} className="flex-1 text-[10px] h-7">Resolve</Button>
            <Button variant="secondary" size="sm" onClick={() => handleBulkAction('open')} className="flex-1 text-[10px] h-7">Reopen</Button>
            <Button variant="secondary" size="sm" onClick={() => handleBulkAction('rejected')} className="flex-1 text-[10px] h-7">Reject</Button>
          </div>
        )}

        <div className="flex gap-1">
           <Button variant="ghost" size="sm" onClick={() => exportReviewJson(annotations)} className="flex-1 text-[10px] h-7 bg-slate-100 dark:bg-slate-800">Export JSON</Button>
           <Button variant="ghost" size="sm" onClick={() => exportReviewText(annotations)} className="flex-1 text-[10px] h-7 bg-slate-100 dark:bg-slate-800">Export Text</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-3 pb-8">
        {sortedAnnotations.length === 0 ? (
           <div className="text-sm text-slate-500 text-center py-4">No comments match the filter.</div>
        ) : (
          sortedAnnotations.map((annotation) => {
            const selected = annotation.id === activeAnnotationId || selectedAnnotationIds.includes(annotation.id);
            const text = typeof annotation.data.text === 'string' && annotation.data.text.trim()
                ? annotation.data.text
                : `[${annotation.type.toUpperCase()}]`;

            const status = annotation.data.reviewStatus || 'open';
            const author = annotation.data.author || 'System';

            return (
              <div
                key={annotation.id}
                className={`flex flex-col text-left rounded-lg border p-3 ${
                  selected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                }`}
              >
                <button
                  className="w-full text-left"
                  onClick={() => {
                    setActiveAnnotationId(annotation.id);
                    setPage(annotation.pageNumber);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Page {annotation.pageNumber} · {annotation.type}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {status}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{author}</div>
                  <div className="text-sm text-slate-800 dark:text-slate-100 mb-2">{text}</div>
                </button>

                <div className="mt-2 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                  {(annotation.data.replies || []).map((reply: ReplyThreadItem) => (
                    <div key={reply.id} className="text-xs space-y-0.5 bg-slate-50 dark:bg-slate-900 p-2 rounded">
                      <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
                         <span>{reply.author}</span>
                         <span className="text-[9px] opacity-70">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-800 dark:text-slate-200">{reply.text}</div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-950"
                      placeholder="Reply..."
                      value={replyText[annotation.id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [annotation.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleReply(annotation.id);
                        }
                      }}
                    />
                    <Button variant="secondary" size="sm" className="h-6 px-2 text-[10px]" onClick={() => handleReply(annotation.id)}>Reply</Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const SearchPanelStub: React.FC = () => {
  return (
    <FeaturePlaceholder
      name="Search"
      description="Use the search-enabled patch from the previous bundle or wire your search panel here."
      icon={<Search />}
    />
  );
};
