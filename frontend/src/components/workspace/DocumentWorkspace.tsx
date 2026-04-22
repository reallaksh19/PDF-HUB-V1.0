import React from 'react';
import { UploadCloud, Lock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import { PdfRendererAdapter, type TextLayerItem } from '@/adapters/pdf-renderer/PdfRendererAdapter';
import { loadAnnotations, saveAnnotations } from '@/core/annotations/persistence';
import { useAnnotationStore } from '@/core/annotations/store';
import type { PdfAnnotation, Rect, AnnotationType, Point2D } from '@/core/annotations/types';
import { useEditorStore } from '@/core/editor/store';
import { useSessionStore } from '@/core/session/store';
import { FileAdapter } from '@/adapters/file/FileAdapter';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { Virtualizer } from 'virtua';

type TransformState =
  | {
      ids: string[];
      targetId: string;
      mode: 'move' | 'resize';
      startClientX: number;
      startClientY: number;
      startRects: Record<string, Rect>;
      startAnchors: Record<string, Point2D | null>;
      startPoints: Record<string, number[] | null>;
      pageWidth: number;
      pageHeight: number;
    }
  | null;

type AnchorDragState =
  | {
      id: string;
      startClientX: number;
      startClientY: number;
      startAnchor: Point2D;
      pageWidth: number;
      pageHeight: number;
    }
  | null;

type TextSelectionDraft = {
  text: string;
  rects: Rect[];
  unionRect: Rect;
};

export const DocumentWorkspace: React.FC = () => {
  const {
    annotations,
    setAnnotations,
    addAnnotation,
    updateAnnotation,
    updateManyAnnotations,
    setActiveAnnotationId,
    selectedAnnotationIds,
    setSelection,
    toggleSelection,
    clearSelection,
  } = useAnnotationStore();

  const {
    workingBytes,
    documentKey,
    viewState,
    setPage,
    openDocument,
  } = useSessionStore();

  const { activeTool } = useEditorStore();

  const [pdfDoc, setPdfDoc] = React.useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [firstPageSize, setFirstPageSize] = React.useState<{ width: number; height: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [pdfDoc]);

  const handleBrowse = async () => {
    try {
      const [picked] = await FileAdapter.pickPdfFiles(false);
      if (!picked) return;

      const safeBytes = new Uint8Array(picked.bytes);
      const pageCount = await PdfEditAdapter.countPages(safeBytes);
      const nextDocumentKey = await FileAdapter.hashBytes(safeBytes);

      openDocument({
        documentKey: nextDocumentKey,
        fileName: picked.name,
        bytes: safeBytes,
        pageCount,
        saveHandle: picked.handle ?? null,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setLoadError(String(err));
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    let previousDoc: PDFDocumentProxy | null = null;

    const load = async () => {
      if (!workingBytes) {
        setPdfDoc(null);
        setLoadError(null);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const doc = await PdfRendererAdapter.loadDocument(workingBytes);
        if (cancelled) {
          await doc.destroy();
          return;
        }

        previousDoc = doc;
        setPdfDoc(doc);

        try {
          const firstPage = await doc.getPage(1);
          const viewport = firstPage.getViewport({ scale: 1 });
          if (!cancelled) {
            setFirstPageSize({ width: viewport.width, height: viewport.height });
          }
        } catch {
          // Ignore
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(String(err));
          setPdfDoc(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (previousDoc) void previousDoc.destroy();
    };
  }, [workingBytes]);

  React.useEffect(() => {
    const loadStored = async () => {
      if (!documentKey) return;
      const stored = await loadAnnotations(documentKey);
      setAnnotations(stored);
    };
    void loadStored();
  }, [documentKey, setAnnotations]);

  React.useEffect(() => {
    if (!documentKey) return;

    const timer = window.setTimeout(() => {
      void saveAnnotations(documentKey, annotations);
    }, 400);

    const flushNow = () => {
      void saveAnnotations(documentKey, useAnnotationStore.getState().annotations);
    };

    window.addEventListener('pagehide', flushNow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pagehide', flushNow);
    };
  }, [annotations, documentKey]);

  if (!workingBytes) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100 dark:bg-slate-950/50">
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Open a PDF to begin
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Annotation layer revamp is active in this build.
          </p>
          <button
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            onClick={handleBrowse}
          >
            Browse Files
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center text-slate-500">Loading PDF…</div>;
  }

  if (loadError) {
    return <div className="h-full flex items-center justify-center text-red-600">Failed to load PDF: {loadError}</div>;
  }

  if (!pdfDoc) return null;

  let effectiveScale = viewState.zoom / 100;
  if (viewState.fitMode === 'width' && containerSize && firstPageSize) {
    // 48px padding (24px each side)
    effectiveScale = (containerSize.width - 48) / firstPageSize.width;
  } else if (viewState.fitMode === 'page' && containerSize && firstPageSize) {
    // 48px padding vertical and horizontal
    effectiveScale = Math.min(
      (containerSize.width - 48) / firstPageSize.width,
      (containerSize.height - 48) / firstPageSize.height
    );
  }

  // Generate pages to render based on viewMode
  let pagesToRender: number[][] = [];
  if (viewState.viewMode === 'single') {
    pagesToRender = [[viewState.currentPage]];
  } else if (viewState.viewMode === 'two-page') {
    pagesToRender.push([1]);
    for (let i = 2; i <= pdfDoc.numPages; i += 2) {
      const pair = [i];
      if (i + 1 <= pdfDoc.numPages) pair.push(i + 1);
      pagesToRender.push(pair);
    }
  } else {
    // continuous
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      pagesToRender.push([i]);
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'hand' && containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeTool === 'hand' && containerRef.current?.hasPointerCapture(e.pointerId)) {
      containerRef.current.scrollBy(-e.movementX, -e.movementY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeTool === 'hand' && containerRef.current?.hasPointerCapture(e.pointerId)) {
      containerRef.current.style.cursor = '';
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const renderPage = (pageNumber: number) => {
    return (
      <PageSurface
        key={pageNumber}
        doc={pdfDoc}
        pageNumber={pageNumber}
        scale={effectiveScale}
        activeTool={activeTool}
        pageAnnotations={annotations
          .filter((annotation) => annotation.pageNumber === pageNumber)
          .slice()
          .sort((a, b) => readZIndex(a) - readZIndex(b))}
        selectedAnnotationIds={selectedAnnotationIds}
        onActivate={() => setPage(pageNumber)}
        onCreateAnnotation={(annotation) => {
          addAnnotation(annotation);
          setSelection([annotation.id]);
          setActiveAnnotationId(annotation.id);
        }}
        onCreateManyAnnotations={(items) => {
          items.forEach((item) => addAnnotation(item));
          if (items.length > 0) {
            const ids = items.map((item) => item.id);
            setSelection(ids);
            setActiveAnnotationId(ids[0] ?? null);
          }
        }}
        onSetSingleSelection={(id) => {
          setSelection([id]);
          setActiveAnnotationId(id);
        }}
        onToggleSelection={(id) => {
          toggleSelection(id);
          setActiveAnnotationId(id);
        }}
        onSetSelection={(ids) => {
          setSelection(ids);
          setActiveAnnotationId(ids[0] ?? null);
        }}
        onClearSelection={clearSelection}
        onCommitAnnotation={(id, patch) => {
          updateAnnotation(id, patch);
        }}
        onCommitManyAnnotations={(updates) => {
          updateManyAnnotations(updates);
        }}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-slate-200 dark:bg-slate-950 overflow-auto outline-none ${
        activeTool === 'hand' ? 'cursor-grab' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      tabIndex={-1}
    >
      <div className="min-h-full flex flex-col items-center py-8 pointer-events-auto">
        {viewState.viewMode === 'continuous' || viewState.viewMode === 'two-page' ? (
          <Virtualizer scrollRef={containerRef} overscan={3}>
            {pagesToRender.map((pair, index) => (
              <div key={index} className="flex justify-center gap-4 mb-8">
                {pair.map((pageNumber) => renderPage(pageNumber))}
              </div>
            ))}
          </Virtualizer>
        ) : (
          <div className="flex justify-center gap-4 mb-8">
            {pagesToRender.map((pair) => pair.map((pageNumber) => renderPage(pageNumber)))}
          </div>
        )}
      </div>
    </div>
  );
};

interface PageSurfaceProps {
  doc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  activeTool: string;
  pageAnnotations: PdfAnnotation[];
  selectedAnnotationIds: string[];
  onActivate: () => void;
  onCreateAnnotation: (annotation: PdfAnnotation) => void;
  onCreateManyAnnotations: (annotations: PdfAnnotation[]) => void;
  onSetSingleSelection: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onSetSelection: (ids: string[]) => void;
  onClearSelection: () => void;
  onCommitAnnotation: (id: string, patch: Partial<PdfAnnotation>) => void;
  onCommitManyAnnotations: (updates: Array<{ id: string; data: Partial<PdfAnnotation> }>) => void;
}

const PageSurface: React.FC<PageSurfaceProps> = ({
  doc,
  pageNumber,
  scale,
  activeTool,
  pageAnnotations,
  selectedAnnotationIds,
  onActivate,
  onCreateAnnotation,
  onCreateManyAnnotations,
  onSetSingleSelection,
  onToggleSelection,
  onSetSelection,
  onClearSelection,
  onCommitAnnotation,
  onCommitManyAnnotations,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const pageRef = React.useRef<HTMLDivElement | null>(null);

  const [size, setSize] = React.useState({ width: 800, height: 1000 });
  const [textItems, setTextItems] = React.useState<TextLayerItem[]>([]);
  const [draftRects, setDraftRects] = React.useState<Record<string, Rect>>({});
  const [draftAnchors, setDraftAnchors] = React.useState<Record<string, Point2D | null>>({});
  const [draftLinePoints, setDraftLinePoints] = React.useState<Record<string, number[]>>({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingValue, setEditingValue] = React.useState('');
  const [marquee, setMarquee] = React.useState<Rect | null>(null);
  const [textSelectionDraft, setTextSelectionDraft] = React.useState<TextSelectionDraft | null>(null);
  const transformRef = React.useRef<TransformState>(null);
  const anchorDragRef = React.useRef<AnchorDragState>(null);
  const draftRectsRef = React.useRef<Record<string, Rect>>({});
  const draftAnchorsRef = React.useRef<Record<string, Point2D | null>>({});
  const draftLinePointsRef = React.useRef<Record<string, number[]>>({});

  React.useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      if (!cancelled) {
        setSize({ width: viewport.width, height: viewport.height });
      }

      if (!cancelled && canvasRef.current) {
        await PdfRendererAdapter.renderPage(page, scale, canvasRef.current);
      }

      const items = await PdfRendererAdapter.getPageTextItems(page, scale);
      if (!cancelled) {
        setTextItems(items);
      }
    };

    void render();

    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, scale]);

  React.useEffect(() => {
    draftRectsRef.current = draftRects;
  }, [draftRects]);

  React.useEffect(() => {
    draftAnchorsRef.current = draftAnchors;
  }, [draftAnchors]);

  React.useEffect(() => {
    draftLinePointsRef.current = draftLinePoints;
  }, [draftLinePoints]);

  const pageWidth = size.width / scale;
  const pageHeight = size.height / scale;

  const clampRect = React.useCallback(
    (rect: Rect): Rect => {
      const width = Math.max(8, Math.min(rect.width, pageWidth));
      const height = Math.max(8, Math.min(rect.height, pageHeight));
      const x = Math.max(0, Math.min(rect.x, pageWidth - width));
      const y = Math.max(0, Math.min(rect.y, pageHeight - height));

      return { x, y, width, height };
    },
    [pageHeight, pageWidth],
  );

  const clearTextSelectionDraft = React.useCallback(() => {
    setTextSelectionDraft(null);
    try {
      window.getSelection()?.removeAllRanges();
    } catch {
      // Ignore browser selection API edge cases.
    }
  }, []);

  const commitTextEdit = (annotation: PdfAnnotation, value: string) => {
    const currentRect = draftRectsRef.current[annotation.id];
    const nextRect =
      annotation.data.autoSize !== false && isTextLike(annotation.type)
        ? autoSizeRectForText(
            value,
            readFontSize(annotation),
            currentRect ?? annotation.rect,
          )
        : currentRect ?? annotation.rect;

    onCommitAnnotation(annotation.id, {
      rect: nextRect,
      data: {
        ...annotation.data,
        text: value,
      },
    });
    setEditingId(null);
  };

  const startTransform = (
    event: React.MouseEvent<HTMLDivElement>,
    annotation: PdfAnnotation,
    mode: 'move' | 'resize',
  ) => {
    if (annotation.data.locked === true) return;

    event.stopPropagation();
    clearTextSelectionDraft();

    const selectedOnPage = pageAnnotations
      .filter((item) => selectedAnnotationIds.includes(item.id) && item.data.locked !== true)
      .map((item) => item.id);

    const ids =
      mode === 'move' &&
      selectedOnPage.includes(annotation.id) &&
      selectedOnPage.length > 1
        ? selectedOnPage
        : [annotation.id];

    if (!(mode === 'move' && ids.length > 1)) {
      onSetSingleSelection(annotation.id);
    }

    const startRects: Record<string, Rect> = {};
    const startAnchors: Record<string, Point2D | null> = {};
    const startPoints: Record<string, number[] | null> = {};

    ids.forEach((id) => {
      const item = pageAnnotations.find((value) => value.id === id);
      if (!item) return;
      startRects[id] = draftRectsRef.current[id] ?? item.rect;
      startAnchors[id] = readAnchor(item, draftAnchorsRef.current[id] ?? null);
      startPoints[id] = readPoints(item, draftLinePointsRef.current[id] ?? null);
    });

    transformRef.current = {
      ids,
      targetId: annotation.id,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startRects,
      startAnchors,
      startPoints,
      pageWidth: size.width / scale,
      pageHeight: size.height / scale,
    };

    const onMove = (moveEvent: MouseEvent) => {
      const current = transformRef.current;
      if (!current) return;

      const dx = (moveEvent.clientX - current.startClientX) / scale;
      const dy = (moveEvent.clientY - current.startClientY) / scale;

      if (current.mode === 'move') {
        const nextRects: Record<string, Rect> = {};
        const nextAnchors: Record<string, Point2D | null> = {};

        current.ids.forEach((id) => {
          const baseRect = current.startRects[id];
          nextRects[id] = clampRect({
            ...baseRect,
            x: baseRect.x + dx,
            y: baseRect.y + dy,
          });

          const anchor = current.startAnchors[id];
          nextAnchors[id] = anchor
            ? {
                x: clamp(anchor.x + dx, 0, current.pageWidth),
                y: clamp(anchor.y + dy, 0, current.pageHeight),
              }
            : null;
        });

        setDraftRects((state) => ({ ...state, ...nextRects }));
        setDraftAnchors((state) => ({ ...state, ...nextAnchors }));
      } else {
        const baseRect = current.startRects[current.targetId];
        const target = pageAnnotations.find((item) => item.id === current.targetId);
        if (!target) return;

        const resized = clampRect({
          ...baseRect,
          width: baseRect.width + dx,
          height: baseRect.height + dy,
        });

        const scaled =
          target.type === 'line' || target.type === 'arrow'
            ? resizeLineLikeRect(baseRect, resized, current.startPoints[current.targetId])
            : { rect: resized, points: null };

        if (target.type === 'line' || target.type === 'arrow') {
          const linePoints = scaled.points;
          if (Array.isArray(linePoints)) {
            setDraftLinePoints((state) => ({
              ...state,
              [current.targetId]: linePoints,
            }));
          }
        }

        setDraftRects((state) => ({
          ...state,
          [current.targetId]: scaled.rect,
        }));
      }
    };

    const onUp = () => {
      const current = transformRef.current;
      if (!current) return;

      if (current.mode === 'move') {
        const liveRects = draftRectsRef.current;
        const liveAnchors = draftAnchorsRef.current;
        onCommitManyAnnotations(
          current.ids.map((id) => ({
            id,
            data: {
              rect: liveRects[id] ?? current.startRects[id],
              data: {
                ...(pageAnnotations.find((item) => item.id === id)?.data ?? {}),
                ...(current.startAnchors[id]
                  ? { anchor: liveAnchors[id] ?? current.startAnchors[id] }
                  : {}),
              },
            } as Partial<PdfAnnotation>,
          })),
        );
      } else {
        const item = pageAnnotations.find((value) => value.id === current.targetId);
        if (item) {
          const liveRects = draftRectsRef.current;
          const livePoints = draftLinePointsRef.current;
          const nextRect = liveRects[current.targetId] ?? current.startRects[current.targetId];
          const nextPoints = livePoints[current.targetId];
          const patch: Partial<PdfAnnotation> = { rect: nextRect };
          if (
            (item.type === 'line' || item.type === 'arrow') &&
            Array.isArray(nextPoints)
          ) {
            patch.data = { ...item.data, points: nextPoints };
          }
          onCommitAnnotation(current.targetId, patch);
        }
      }

      setDraftRects((state) => {
        const next = { ...state };
        current.ids.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      setDraftAnchors((state) => {
        const next = { ...state };
        current.ids.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      setDraftLinePoints((state) => {
        const next = { ...state };
        current.ids.forEach((id) => {
          delete next[id];
        });
        return next;
      });

      transformRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startAnchorDrag = (
    event: React.MouseEvent<HTMLDivElement>,
    annotation: PdfAnnotation,
  ) => {
    if (annotation.data.locked === true) return;

    const anchor = readAnchor(annotation, draftAnchors[annotation.id] ?? null);
    if (!anchor) return;

    event.stopPropagation();
    clearTextSelectionDraft();
    onSetSingleSelection(annotation.id);

    anchorDragRef.current = {
      id: annotation.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startAnchor: anchor,
      pageWidth,
      pageHeight,
    };

    const onMove = (moveEvent: MouseEvent) => {
      const current = anchorDragRef.current;
      if (!current) return;

      const dx = (moveEvent.clientX - current.startClientX) / scale;
      const dy = (moveEvent.clientY - current.startClientY) / scale;

      setDraftAnchors((state) => ({
        ...state,
        [current.id]: {
          x: clamp(current.startAnchor.x + dx, 0, current.pageWidth),
          y: clamp(current.startAnchor.y + dy, 0, current.pageHeight),
        },
      }));
    };

    const onUp = () => {
      const current = anchorDragRef.current;
      if (!current) return;

      const item = pageAnnotations.find((value) => value.id === current.id);
      if (item) {
        const liveAnchors = draftAnchorsRef.current;
        onCommitAnnotation(current.id, {
          data: {
            ...item.data,
            anchor: liveAnchors[current.id] ?? current.startAnchor,
          },
        });
      }

      setDraftAnchors((state) => {
        const next = { ...state };
        delete next[current.id];
        return next;
      });

      anchorDragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTextSelectionMouseUp = () => {
    if (activeTool !== 'select' || !pageRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setTextSelectionDraft(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setTextSelectionDraft(null);
      return;
    }

    const pageRect = pageRef.current.getBoundingClientRect();
    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects())
      .map((domRect) => domRectToPageRect(domRect, pageRect, scale))
      .filter((rect) => rect.width > 2 && rect.height > 2);

    if (rects.length === 0) {
      setTextSelectionDraft(null);
      return;
    }

    setTextSelectionDraft({
      text,
      rects,
      unionRect: unionRects(rects),
    });
  };

  const createHighlightsFromSelection = () => {
    if (!textSelectionDraft) return;
    const items = textSelectionDraft.rects.map((rect) =>
      buildHighlightAnnotation(pageNumber, rect),
    );
    onCreateManyAnnotations(items);
    clearTextSelectionDraft();
  };

  const createNoteFromSelection = () => {
    if (!textSelectionDraft) return;
    const item = buildCalloutFromSelection(
      pageNumber,
      textSelectionDraft.unionRect,
      textSelectionDraft.text,
      pageWidth,
      pageHeight,
    );
    onCreateAnnotation(item);
    clearTextSelectionDraft();
  };

  const marqueeRef = React.useRef<Rect | null>(null);
  React.useEffect(() => {
    marqueeRef.current = marquee;
  }, [marquee]);

  const startMarquee = (event: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'select') return;
    if (event.target !== event.currentTarget) return;

    clearTextSelectionDraft();
    const hostRect = event.currentTarget.getBoundingClientRect();
    const startX = (event.clientX - hostRect.left) / scale;
    const startY = (event.clientY - hostRect.top) / scale;
    let latestMarquee: Rect = { x: startX, y: startY, width: 0, height: 0 };
    setMarquee(latestMarquee);

    const onMove = (moveEvent: MouseEvent) => {
      const x = (moveEvent.clientX - hostRect.left) / scale;
      const y = (moveEvent.clientY - hostRect.top) / scale;
      latestMarquee = {
        x: Math.min(startX, x),
        y: Math.min(startY, y),
        width: Math.abs(x - startX),
        height: Math.abs(y - startY),
      };
      setMarquee(latestMarquee);
    };

    const onUp = () => {
      const currentMarquee = marqueeRef.current ?? latestMarquee;
      if (currentMarquee) {
        const hitIds = pageAnnotations
          .filter((annotation) => intersects(annotation.rect, currentMarquee))
          .map((annotation) => annotation.id);

        if (event.metaKey || event.ctrlKey) {
          hitIds.forEach((id) => onToggleSelection(id));
        } else if (hitIds.length > 0) {
          onSetSelection(hitIds);
        } else {
          onClearSelection();
        }
      }

      setMarquee(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onActivate();

    const hostRect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - hostRect.left) / scale;
    const y = (event.clientY - hostRect.top) / scale;

    if (
      activeTool === 'textbox' ||
      activeTool === 'comment' ||
      activeTool === 'stamp' ||
      activeTool === 'highlight' ||
      activeTool === 'shape' ||
      activeTool === 'line' ||
      activeTool === 'arrow' ||
      activeTool === 'callout'
    ) {
      clearTextSelectionDraft();
      onCreateAnnotation(buildAnnotation(activeTool as AnnotationType, pageNumber, x, y));
      return;
    }

    if (activeTool === 'select' && event.target !== event.currentTarget) {
      return;
    }

    clearTextSelectionDraft();
    onClearSelection();
  };

  return (
    <div
      ref={pageRef}
      className="relative bg-white dark:bg-slate-900 shadow-md mb-8 transition-all hover:ring-1 hover:ring-slate-300"
      style={{ width: size.width, minHeight: size.height }}
      onClick={onActivate}
    >
      <canvas ref={canvasRef} className="block" />

      <div
        className="absolute inset-0"
        style={{
          pointerEvents: activeTool === 'select' ? 'auto' : 'none',
          userSelect: activeTool === 'select' ? 'text' : 'none',
        }}
        onMouseDown={startMarquee}
        onMouseUp={handleTextSelectionMouseUp}
      >
        {textItems.map((item) => (
          <span
            key={item.id}
            style={{
              position: 'absolute',
              left: item.x,
              top: item.y,
              width: item.width,
              height: item.height,
              fontSize: item.fontSize,
              lineHeight: `${item.height}px`,
              whiteSpace: 'pre',
              color: 'rgba(0,0,0,0.01)',
            }}
          >
            {item.text}
          </span>
        ))}
      </div>

      {textSelectionDraft && (
        <>
          {textSelectionDraft.rects.map((rect, index) => (
            <div
              key={`sel-${index}`}
              className="absolute pointer-events-none bg-yellow-300/35 border border-yellow-400/40"
              style={{
                left: rect.x * scale,
                top: rect.y * scale,
                width: rect.width * scale,
                height: rect.height * scale,
              }}
            />
          ))}

          <div
            className="absolute z-30 flex items-center gap-2 rounded-lg bg-slate-900 text-white px-2 py-1 shadow-lg"
            style={{
              left: Math.max(6, textSelectionDraft.unionRect.x * scale),
              top: Math.max(6, textSelectionDraft.unionRect.y * scale - 34),
            }}
          >
            <button
              className="text-xs hover:text-yellow-300"
              onClick={createHighlightsFromSelection}
            >
              Highlight
            </button>
            <button
              className="text-xs hover:text-blue-300"
              onClick={createNoteFromSelection}
            >
              Note
            </button>
            <button
              className="text-xs opacity-70 hover:opacity-100"
              onClick={clearTextSelectionDraft}
            >
              ×
            </button>
          </div>
        </>
      )}

      <div
        className={`absolute inset-0 ${
          activeTool !== 'select' ? 'cursor-crosshair' : ''
        }`}
        style={{ pointerEvents: activeTool === 'select' ? 'none' : 'auto' }}
        onClick={handleOverlayClick}
      >
        {pageAnnotations.map((annotation) => {
          const selected = selectedAnnotationIds.includes(annotation.id);
          const rect = draftRects[annotation.id] ?? annotation.rect;
          const anchor = readAnchor(annotation, draftAnchors[annotation.id] ?? null);

          if (annotation.type === 'line' || annotation.type === 'arrow') {
            return (
              <LineLikeNode
                key={annotation.id}
                annotation={annotation}
                rect={rect}
                points={draftLinePoints[annotation.id]}
                selected={selected}
                scale={scale}
                onSelect={(event) => {
                  event.stopPropagation();
                  clearTextSelectionDraft();
                  if (event.metaKey || event.ctrlKey) {
                    onToggleSelection(annotation.id);
                  } else {
                    onSetSingleSelection(annotation.id);
                  }
                }}
                onTransform={(event, mode) => startTransform(event, annotation, mode)}
              />
            );
          }

          if (annotation.type === 'callout' && anchor) {
            return (
              <CalloutNode
                key={annotation.id}
                annotation={annotation}
                rect={rect}
                anchor={anchor}
                selected={selected}
                scale={scale}
                editingId={editingId}
                editingValue={editingValue}
                setEditingValue={setEditingValue}
                setEditingId={setEditingId}
                onSelect={(event) => {
                  event.stopPropagation();
                  clearTextSelectionDraft();
                  if (event.metaKey || event.ctrlKey) {
                    onToggleSelection(annotation.id);
                  } else {
                    onSetSingleSelection(annotation.id);
                  }
                }}
                onTransform={(event, mode) => startTransform(event, annotation, mode)}
                onAnchorDrag={(event) => startAnchorDrag(event, annotation)}
                onDoubleClick={() => {
                  if (annotation.data.locked === true) return;
                  setEditingId(annotation.id);
                  setEditingValue(readText(annotation));
                }}
                onCommitText={(value) => commitTextEdit(annotation, value)}
              />
            );
          }

          return (
            <BoxNode
              key={annotation.id}
              annotation={annotation}
              rect={rect}
              selected={selected}
              scale={scale}
              editingId={editingId}
              editingValue={editingValue}
              setEditingValue={setEditingValue}
              setEditingId={setEditingId}
                onSelect={(event) => {
                  event.stopPropagation();
                  clearTextSelectionDraft();
                  if (event.metaKey || event.ctrlKey) {
                    onToggleSelection(annotation.id);
                  } else {
                  onSetSingleSelection(annotation.id);
                }
              }}
              onTransform={(event, mode) => startTransform(event, annotation, mode)}
              onDoubleClick={() => {
                if (!isTextLike(annotation.type) || annotation.data.locked === true) return;
                setEditingId(annotation.id);
                setEditingValue(readText(annotation));
              }}
              onCommitText={(value) => commitTextEdit(annotation, value)}
            />
          );
        })}

        {marquee && (
          <div
            className="absolute pointer-events-none border border-blue-500 bg-blue-200/20"
            style={{
              left: marquee.x * scale,
              top: marquee.y * scale,
              width: marquee.width * scale,
              height: marquee.height * scale,
            }}
          />
        )}
      </div>

      <div className="absolute top-2 right-2 bg-slate-900/70 text-white text-xs px-2 py-1 rounded">
        Page {pageNumber}
      </div>
    </div>
  );
};

const BoxNode: React.FC<{
  annotation: PdfAnnotation;
  rect: Rect;
  selected: boolean;
  scale: number;
  editingId: string | null;
  editingValue: string;
  setEditingValue: (value: string) => void;
  setEditingId: (id: string | null) => void;
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTransform: (event: React.MouseEvent<HTMLDivElement>, mode: 'move' | 'resize') => void;
  onDoubleClick: () => void;
  onCommitText: (value: string) => void;
}> = ({
  annotation,
  rect,
  selected,
  scale,
  editingId,
  editingValue,
  setEditingValue,
  setEditingId,
  onSelect,
  onTransform,
  onDoubleClick,
  onCommitText,
}) => {
  const style = annotationVisualStyle(annotation, selected);

  return (
    <div
      className="absolute pointer-events-auto overflow-hidden transition-shadow"
      style={{
        left: rect.x * scale,
        top: rect.y * scale,
        width: rect.width * scale,
        height: rect.height * scale,
        ...style,
      }}
      onClick={onSelect}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onDoubleClick();
      }}
      onMouseDown={(event) => {
        if (annotation.data.locked === true) return;
        onTransform(event, 'move');
      }}
    >
      {annotation.data.locked === true && (
        <div className="absolute top-1 right-1 opacity-70">
          <Lock className="w-3.5 h-3.5" />
        </div>
      )}

      {editingId === annotation.id && isTextLike(annotation.type) ? (
        <textarea
          autoFocus
          className="w-full h-full bg-white/95 text-slate-900 p-1 text-[11px] outline-none resize-none"
          value={editingValue}
          onChange={(event) => setEditingValue(event.target.value)}
          onBlur={() => {
            onCommitText(editingValue);
            setEditingId(null);
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              onCommitText(editingValue);
              setEditingId(null);
            }
            if (event.key === 'Escape') {
              setEditingId(null);
            }
          }}
        />
      ) : (
        <div
          className="w-full h-full px-1 py-0.5 select-none"
          style={{
            fontSize: `${readFontSize(annotation) * scale}px`,
            textAlign: readTextAlign(annotation),
            fontWeight: readFontWeight(annotation),
            lineHeight: 1.25,
          }}
        >
          {renderVisibleContent(annotation)}
        </div>
      )}

      {selected && annotation.data.locked !== true && (
        <div
          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 rounded-tl-sm cursor-se-resize"
          onMouseDown={(event) => {
            event.stopPropagation();
            onTransform(event, 'resize');
          }}
        />
      )}
    </div>
  );
};

const CalloutNode: React.FC<{
  annotation: PdfAnnotation;
  rect: Rect;
  anchor: Point2D;
  selected: boolean;
  scale: number;
  editingId: string | null;
  editingValue: string;
  setEditingValue: (value: string) => void;
  setEditingId: (id: string | null) => void;
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTransform: (event: React.MouseEvent<HTMLDivElement>, mode: 'move' | 'resize') => void;
  onAnchorDrag: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick: () => void;
  onCommitText: (value: string) => void;
}> = ({
  annotation,
  rect,
  anchor,
  selected,
  scale,
  editingId,
  editingValue,
  setEditingValue,
  setEditingId,
  onSelect,
  onTransform,
  onAnchorDrag,
  onDoubleClick,
  onCommitText,
}) => {
  const style = annotationVisualStyle(annotation, selected);
  const line = computeCalloutLeader(anchor, rect);

  return (
    <>
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        <line
          x1={line.x1 * scale}
          y1={line.y1 * scale}
          x2={line.x2 * scale}
          y2={line.y2 * scale}
          stroke={typeof annotation.data.borderColor === 'string' ? annotation.data.borderColor : '#334155'}
          strokeWidth={2}
        />
        {selected && (
          <circle
            cx={anchor.x * scale}
            cy={anchor.y * scale}
            r={4}
            fill="#2563eb"
          />
        )}
      </svg>

      {selected && annotation.data.locked !== true && (
        <div
          className="absolute pointer-events-auto w-3.5 h-3.5 rounded-full bg-blue-600 border border-white shadow cursor-move"
          style={{
            left: anchor.x * scale - 7,
            top: anchor.y * scale - 7,
          }}
          onMouseDown={onAnchorDrag}
          title="Drag callout anchor"
        />
      )}

      <div
        className="absolute pointer-events-auto overflow-hidden transition-shadow"
        style={{
          left: rect.x * scale,
          top: rect.y * scale,
          width: rect.width * scale,
          height: rect.height * scale,
          ...style,
        }}
        onClick={onSelect}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onDoubleClick();
        }}
        onMouseDown={(event) => {
          if (annotation.data.locked === true) return;
          onTransform(event, 'move');
        }}
      >
        {annotation.data.locked === true && (
          <div className="absolute top-1 right-1 opacity-70">
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}

        {editingId === annotation.id ? (
          <textarea
            autoFocus
            className="w-full h-full bg-white/95 text-slate-900 p-1 text-[11px] outline-none resize-none"
            value={editingValue}
            onChange={(event) => setEditingValue(event.target.value)}
            onBlur={() => {
              onCommitText(editingValue);
              setEditingId(null);
            }}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                onCommitText(editingValue);
                setEditingId(null);
              }
              if (event.key === 'Escape') {
                setEditingId(null);
              }
            }}
          />
        ) : (
          <div
            className="w-full h-full px-2 py-1 select-none"
            style={{
              fontSize: `${readFontSize(annotation) * scale}px`,
              textAlign: readTextAlign(annotation),
              fontWeight: readFontWeight(annotation),
              lineHeight: 1.25,
            }}
          >
            {renderVisibleContent(annotation)}
          </div>
        )}

        {selected && annotation.data.locked !== true && (
          <div
            className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 rounded-tl-sm cursor-se-resize"
            onMouseDown={(event) => {
              event.stopPropagation();
              onTransform(event, 'resize');
            }}
          />
        )}
      </div>
    </>
  );
};

const LineLikeNode: React.FC<{
  annotation: PdfAnnotation;
  rect: Rect;
  points?: number[];
  selected: boolean;
  scale: number;
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
  onTransform: (event: React.MouseEvent<HTMLDivElement>, mode: 'move' | 'resize') => void;
}> = ({ annotation, rect, points: pointsOverride, selected, scale, onSelect, onTransform }) => {
  const points = Array.isArray(pointsOverride)
    ? pointsOverride
    : Array.isArray(annotation.data.points)
    ? (annotation.data.points as number[])
    : [0, rect.height / 2, rect.width, rect.height / 2];

  const color =
    typeof annotation.data.borderColor === 'string'
      ? annotation.data.borderColor
      : '#111827';

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: rect.x * scale,
        top: rect.y * scale,
        width: rect.width * scale,
        height: rect.height * scale,
      }}
      onClick={onSelect}
      onMouseDown={(event) => {
        if (annotation.data.locked === true) return;
        onTransform(event, 'move');
      }}
    >
      <svg width="100%" height="100%" className={selected ? 'overflow-visible' : ''}>
        <line
          x1={points[0] * scale}
          y1={points[1] * scale}
          x2={points[2] * scale}
          y2={points[3] * scale}
          stroke={color}
          strokeWidth={2}
        />
        {annotation.type === 'arrow' && (
          <polygon
            points={arrowHeadPolygon(points, scale)}
            fill={color}
          />
        )}
      </svg>

      {selected && annotation.data.locked !== true && (
        <div
          className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 rounded-tl-sm cursor-se-resize"
          onMouseDown={(event) => {
            event.stopPropagation();
            onTransform(event, 'resize');
          }}
        />
      )}
    </div>
  );
};

function buildAnnotation(
  tool: AnnotationType,
  pageNumber: number,
  x: number,
  y: number,
): PdfAnnotation {
  const now = Date.now();
  const common = {
    id: uuidv4(),
    pageNumber,
    createdAt: now,
    updatedAt: now,
  };

  switch (tool) {
    case 'highlight':
      return {
        ...common,
        type: 'highlight',
        rect: { x, y, width: 180, height: 26 },
        data: {
          backgroundColor: '#fde047',
          borderColor: '#facc15',
          opacity: 0.38,
        },
      };

    case 'shape':
      return {
        ...common,
        type: 'shape',
        rect: { x, y, width: 180, height: 60 },
        data: {
          backgroundColor: 'transparent',
          borderColor: '#3b82f6',
          borderWidth: 2,
        },
      };

    case 'stamp':
      return {
        ...common,
        type: 'stamp',
        rect: { x, y, width: 150, height: 36 },
        data: {
          text: 'APPROVED',
          backgroundColor: '#fef2f2',
          borderColor: '#ef4444',
          textColor: '#b91c1c',
          fontWeight: 'bold',
          fontSize: 14,
          autoSize: false,
        },
      };

    case 'comment':
      return {
        ...common,
        type: 'comment',
        rect: autoSizeRectForText('New note', 12, { x, y, width: 200, height: 72 }),
        data: {
          text: 'New note',
          title: 'Note',
          backgroundColor: '#fff7cc',
          borderColor: '#d4b106',
          textColor: '#111827',
          fontSize: 12,
          autoSize: true,
        },
      };

    case 'callout':
      return {
        ...common,
        type: 'callout',
        rect: autoSizeRectForText('New callout', 12, { x: x + 26, y: y - 12, width: 220, height: 64 }),
        data: {
          text: 'New callout',
          backgroundColor: '#ffffff',
          borderColor: '#475569',
          textColor: '#111827',
          fontSize: 12,
          autoSize: true,
          anchor: { x, y },
        },
      };

    case 'line':
      return {
        ...common,
        type: 'line',
        rect: { x, y, width: 180, height: 40 },
        data: {
          borderColor: '#111827',
          points: [0, 20, 180, 20],
        },
      };

    case 'arrow':
      return {
        ...common,
        type: 'arrow',
        rect: { x, y, width: 180, height: 40 },
        data: {
          borderColor: '#111827',
          points: [0, 20, 180, 20],
        },
      };

    default:
      return {
        ...common,
        type: 'textbox',
        rect: autoSizeRectForText('New text box', 12, { x, y, width: 220, height: 40 }),
        data: {
          text: 'New text box',
          backgroundColor: '#ffffff',
          borderColor: '#60a5fa',
          textColor: '#0f172a',
          fontSize: 12,
          autoSize: true,
        },
      };
  }
}

function buildHighlightAnnotation(pageNumber: number, rect: Rect): PdfAnnotation {
  const now = Date.now();
  return {
    id: uuidv4(),
    type: 'highlight',
    pageNumber,
    rect,
    data: {
      backgroundColor: '#fde047',
      borderColor: '#facc15',
      opacity: 0.38,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function buildCalloutFromSelection(
  pageNumber: number,
  sourceRect: Rect,
  text: string,
  pageWidth: number,
  pageHeight: number,
): PdfAnnotation {
  const now = Date.now();
  const anchor = {
    x: sourceRect.x + sourceRect.width / 2,
    y: sourceRect.y + sourceRect.height / 2,
  };

  const seeded = autoSizeRectForText(text, 12, {
    x: sourceRect.x + sourceRect.width + 24,
    y: Math.max(8, sourceRect.y - 8),
    width: 220,
    height: 64,
  });

  const clamped = {
    ...seeded,
    x: clamp(seeded.x, 0, Math.max(0, pageWidth - seeded.width)),
    y: clamp(seeded.y, 0, Math.max(0, pageHeight - seeded.height)),
  };

  return {
    id: uuidv4(),
    type: 'callout',
    pageNumber,
    rect: clamped,
    data: {
      text,
      backgroundColor: '#ffffff',
      borderColor: '#475569',
      textColor: '#111827',
      fontSize: 12,
      autoSize: true,
      anchor,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function isTextLike(type: AnnotationType): boolean {
  return type === 'textbox' || type === 'comment' || type === 'stamp' || type === 'callout';
}

function readText(annotation: PdfAnnotation): string {
  if (typeof annotation.data.text === 'string') return annotation.data.text;
  if (typeof annotation.data.content === 'string') return annotation.data.content;
  return '';
}

function readFontSize(annotation: PdfAnnotation): number {
  return typeof annotation.data.fontSize === 'number' ? annotation.data.fontSize : 12;
}

function readFontWeight(annotation: PdfAnnotation): 'normal' | 'bold' {
  return annotation.data.fontWeight === 'bold' ? 'bold' : 'normal';
}

function readTextAlign(annotation: PdfAnnotation): 'left' | 'center' | 'right' {
  return annotation.data.textAlign === 'center' || annotation.data.textAlign === 'right'
    ? annotation.data.textAlign
    : 'left';
}

function readAnchor(
  annotation: PdfAnnotation,
  fallback: Point2D | null,
): Point2D | null {
  const anchor = annotation.data.anchor;
  if (
    anchor &&
    typeof anchor === 'object' &&
    typeof (anchor as { x?: unknown }).x === 'number' &&
    typeof (anchor as { y?: unknown }).y === 'number'
  ) {
    return anchor as Point2D;
  }
  return fallback;
}

function readZIndex(annotation: PdfAnnotation): number {
  return typeof annotation.data.zIndex === 'number' ? annotation.data.zIndex : 0;
}

function renderVisibleContent(annotation: PdfAnnotation): React.ReactNode {
  if (annotation.type === 'highlight') return null;
  if (annotation.type === 'shape') return null;
  if (annotation.type === 'line' || annotation.type === 'arrow') return null;

  const text = readText(annotation);
  if (text.trim().length > 0) return text;

  if (annotation.type === 'comment') return 'Note';
  if (annotation.type === 'callout') return 'Callout';
  if (annotation.type === 'textbox') return 'Text';
  return null;
}

function annotationVisualStyle(
  annotation: PdfAnnotation,
  selected: boolean,
): React.CSSProperties {
  const backgroundColor =
    typeof annotation.data.backgroundColor === 'string'
      ? annotation.data.backgroundColor
      : annotation.type === 'highlight'
      ? '#fde047'
      : annotation.type === 'comment'
      ? '#fff7cc'
      : annotation.type === 'stamp'
      ? '#fef2f2'
      : 'transparent';

  const borderColor =
    typeof annotation.data.borderColor === 'string'
      ? annotation.data.borderColor
      : annotation.type === 'shape'
      ? '#3b82f6'
      : annotation.type === 'stamp'
      ? '#ef4444'
      : '#60a5fa';

  const textColor =
    typeof annotation.data.textColor === 'string'
      ? annotation.data.textColor
      : annotation.type === 'stamp'
      ? '#b91c1c'
      : '#0f172a';

  const borderWidth =
    typeof annotation.data.borderWidth === 'number'
      ? annotation.data.borderWidth
      : annotation.type === 'shape'
      ? 2
      : 1;

  return {
    backgroundColor,
    border: `${selected ? Math.max(borderWidth, 2) : borderWidth}px solid ${
      selected ? '#2563eb' : borderColor
    }`,
    color: textColor,
    opacity:
      typeof annotation.data.opacity === 'number'
        ? annotation.data.opacity
        : annotation.type === 'highlight'
        ? 0.38
        : 0.9,
    boxShadow: selected ? '0 0 0 2px rgba(37, 99, 235, 0.18)' : undefined,
    borderRadius: annotation.type === 'comment' ? 6 : 2,
  };
}

function autoSizeRectForText(text: string, fontSize: number, rect: Rect): Rect {
  const lines = text.split('\n');
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const width = Math.max(120, Math.min(380, longest * (fontSize * 0.62) + 20));
  const height = Math.max(36, lines.length * (fontSize * 1.5) + 14);
  return { ...rect, width, height };
}

function computeCalloutLeader(anchor: Point2D, rect: Rect) {
  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;
  const cx = clamp(anchor.x, left, right);
  const cy = clamp(anchor.y, top, bottom);

  const distances = [
    { x: left, y: cy, d: Math.abs(anchor.x - left) },
    { x: right, y: cy, d: Math.abs(anchor.x - right) },
    { x: cx, y: top, d: Math.abs(anchor.y - top) },
    { x: cx, y: bottom, d: Math.abs(anchor.y - bottom) },
  ].sort((a, b) => a.d - b.d);

  return {
    x1: anchor.x,
    y1: anchor.y,
    x2: distances[0].x,
    y2: distances[0].y,
  };
}

function readPoints(
  annotation: PdfAnnotation,
  fallback: number[] | null,
): number[] | null {
  if (Array.isArray(annotation.data.points) && annotation.data.points.length === 4) {
    return [...(annotation.data.points as number[])];
  }
  return fallback ? [...fallback] : null;
}

function resizeLineLikeRect(
  oldRect: Rect,
  newRect: Rect,
  points: number[] | null,
): { rect: Rect; points: number[] | null } {
  if (!Array.isArray(points) || points.length !== 4) {
    return { rect: newRect, points: null };
  }

  const sx = newRect.width / Math.max(1, oldRect.width);
  const sy = newRect.height / Math.max(1, oldRect.height);
  const nextPoints = [
    points[0] * sx,
    points[1] * sy,
    points[2] * sx,
    points[3] * sy,
  ];

  return { rect: newRect, points: nextPoints };
}

function arrowHeadPolygon(points: number[], scale: number): string {
  const [x1, y1, x2, y2] = points.map((value) => value * scale);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 10;
  const leftX = x2 - size * Math.cos(angle - Math.PI / 6);
  const leftY = y2 - size * Math.sin(angle - Math.PI / 6);
  const rightX = x2 - size * Math.cos(angle + Math.PI / 6);
  const rightY = y2 - size * Math.sin(angle + Math.PI / 6);
  return `${x2},${y2} ${leftX},${leftY} ${rightX},${rightY}`;
}

function domRectToPageRect(domRect: DOMRect, pageRect: DOMRect, scale: number): Rect {
  return {
    x: (domRect.left - pageRect.left) / scale,
    y: (domRect.top - pageRect.top) / scale,
    width: domRect.width / scale,
    height: domRect.height / scale,
  };
}

function unionRects(rects: Rect[]): Rect {
  const left = Math.min(...rects.map((rect) => rect.x));
  const top = Math.min(...rects.map((rect) => rect.y));
  const right = Math.max(...rects.map((rect) => rect.x + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

function intersects(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
