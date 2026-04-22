import React from 'react';
import { Layers, GripVertical } from 'lucide-react';
import { useSessionStore } from '@/core/session/store';
import { PdfRendererAdapter } from '@/adapters/pdf-renderer/PdfRendererAdapter';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { FeaturePlaceholder } from '@/components/ui/FeaturePlaceholder';
import { VList } from 'virtua';

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

  const pageCount = thumbs.length;

  React.useEffect(() => {
    let cancelled = false;

    const loadThumbnails = async () => {
      if (!workingBytes) {
        setThumbs([]);
        return;
      }
      setLoading(true);
      try {
        const doc = await PdfRendererAdapter.loadDocument(workingBytes);
        const count = doc.numPages;
        const result: ThumbItem[] = [];
        for (let i = 1; i <= count; i++) {
          if (cancelled) break;
          const page = await doc.getPage(i);
          const imageUrl = await PdfRendererAdapter.getThumbnail(page);
          result.push({ pageNumber: i, imageUrl });
        }
        if (!cancelled) setThumbs(result);
        await doc.destroy();
      } catch (err) {
        console.error('Failed to load thumbnails', err);
      } finally {
        if (!cancelled) setLoading(false);
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
    event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
    pageNumber: number,
  ) => {
    if (event.metaKey || event.ctrlKey) {
      toggleSelectedPage(pageNumber);
    } else {
      setSelectedPages([pageNumber]);
      setPage(pageNumber);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    pageNumber: number,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(event, pageNumber);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (pageNumber < pageCount) {
        const nextThumb = document.getElementById(`thumbnail-${pageNumber + 1}`);
        nextThumb?.focus();
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (pageNumber > 1) {
        const prevThumb = document.getElementById(`thumbnail-${pageNumber - 1}`);
        prevThumb?.focus();
      }
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
    <div className="h-full flex flex-col p-3">
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 shrink-0">
        Ctrl/Cmd-click to multi-select pages.
      </div>

      {loading && <div className="text-sm text-slate-500 shrink-0 mb-3">Generating thumbnails...</div>}

      <div className="flex-1 overflow-y-auto">
        <VList data={thumbs} overscan={2}>
          {(thumb) => {
            const active = thumb.pageNumber === viewState.currentPage;
            const selected = selectedPages.includes(thumb.pageNumber);

            return (
              <div
                key={thumb.pageNumber}
                id={`thumbnail-${thumb.pageNumber}`}
                draggable
                tabIndex={0}
                role="button"
                aria-label={`Page ${thumb.pageNumber}`}
                aria-pressed={selected || active}
                onDragStart={() => setDragPage(thumb.pageNumber)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => void handleDrop(thumb.pageNumber)}
                onClick={(event) => handleSelect(event, thumb.pageNumber)}
                onKeyDown={(event) => handleKeyDown(event, thumb.pageNumber)}
                className={`group rounded-lg border p-2 mb-3 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${
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
          }}
        </VList>
      </div>
    </div>
  );
};

export default ThumbnailSidebar;
