import { create } from 'zustand';
import type { DocumentSession, FitMode, ViewMode } from './types';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';
import { useAnnotationStore } from '../annotations/store';

export interface OpenDocumentPayload {
  documentKey: string;
  fileName: string;
  bytes: Uint8Array;
  pageCount: number;
  saveHandle?: FileSystemFileHandle | null;
}

export interface SessionActions {
  openDocument: (payload: OpenDocumentPayload) => void;
  replaceWorkingCopy: (bytes: Uint8Array, pageCount: number) => void;
  setPage: (pageNumber: number) => void;
  setZoom: (zoom: number) => void;
  setFitMode: (fitMode: FitMode) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setDocumentDirty: (isDirty: boolean) => void;
  setReviewDirty: (isDirty: boolean) => void;
  setSessionDirty: (isDirty: boolean) => void;
  setSaveHandle: (saveHandle: FileSystemFileHandle | null) => void;
  setSelectedPages: (pages: number[]) => void;
  toggleSelectedPage: (page: number) => void;
  clearSelectedPages: () => void;
  clearDocument: () => void;

  // Save / Export
  saveWorkingDocument: () => Promise<Uint8Array | null>;
  saveSessionSnapshot: () => Promise<void>;
  exportFlattenedReviewCopy: () => Promise<Uint8Array | null>;
  downloadProcessedPdf: () => Promise<Uint8Array | null>;
}

function uniqSorted(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

export const useSessionStore = create<DocumentSession & SessionActions>((set, get) => ({
  documentKey: null,
  fileName: null,
  originalBytes: null,
  workingBytes: null,
  pageCount: 0,
  isDocumentDirty: false,
  isReviewDirty: false,
  isSessionDirty: false,
  saveHandle: null,
  selectedPages: [],
  viewState: {
    currentPage: 1,
    zoom: 100,
    fitMode: 'manual',
    viewMode: 'continuous',
  },

  openDocument: ({ documentKey, fileName, bytes, pageCount, saveHandle = null }) =>
    set({
      documentKey,
      fileName,
      originalBytes: new Uint8Array(bytes),
      workingBytes: new Uint8Array(bytes),
      pageCount,
      isDocumentDirty: false,
      isReviewDirty: false,
      isSessionDirty: false,
      saveHandle,
      selectedPages: [],
      viewState: {
        currentPage: 1,
        zoom: 100,
        fitMode: 'manual',
        viewMode: 'continuous',
      },
    }),

  replaceWorkingCopy: (bytes, pageCount) =>
    set((state) => ({
      workingBytes: new Uint8Array(bytes),
      pageCount,
      isDocumentDirty: true,
      selectedPages: state.selectedPages.filter((page) => page >= 1 && page <= pageCount),
      viewState: {
        ...state.viewState,
        currentPage: Math.max(1, Math.min(state.viewState.currentPage, pageCount)),
      },
    })),

  setPage: (currentPage) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        currentPage: Math.max(1, Math.min(currentPage, Math.max(1, state.pageCount))),
      },
    })),

  setZoom: (zoom) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        zoom,
        fitMode: 'manual',
      },
    })),

  setFitMode: (fitMode) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        fitMode,
      },
    })),

  setViewMode: (viewMode) =>
    set((state) => ({
      viewState: {
        ...state.viewState,
        viewMode,
      },
    })),

  setDocumentDirty: (isDocumentDirty) => set({ isDocumentDirty }),
  setReviewDirty: (isReviewDirty) => set({ isReviewDirty }),
  setSessionDirty: (isSessionDirty) => set({ isSessionDirty }),
  setSaveHandle: (saveHandle) => set({ saveHandle }),

  setSelectedPages: (pages) =>
    set((state) => ({
      selectedPages: uniqSorted(
        pages.filter((page) => page >= 1 && page <= Math.max(1, state.pageCount)),
      ),
    })),

  toggleSelectedPage: (page) =>
    set((state) => {
      const exists = state.selectedPages.includes(page);
      return {
        selectedPages: exists
          ? state.selectedPages.filter((value) => value !== page)
          : uniqSorted([...state.selectedPages, page]),
      };
    }),

  clearSelectedPages: () => set({ selectedPages: [] }),

  clearDocument: () =>
    set({
      documentKey: null,
      fileName: null,
      originalBytes: null,
      workingBytes: null,
      pageCount: 0,
      isDocumentDirty: false,
      isReviewDirty: false,
      isSessionDirty: false,
      saveHandle: null,
      selectedPages: [],
      viewState: {
        currentPage: 1,
        zoom: 100,
        fitMode: 'manual',
        viewMode: 'continuous',
      },
    }),

  saveWorkingDocument: async () => {
    const { workingBytes } = get();
    if (!workingBytes) return null;
    set({ isDocumentDirty: false });
    return workingBytes;
  },

  saveSessionSnapshot: async () => {
    // Session snapshot logic is a placeholder
    set({ isSessionDirty: false });
  },

  exportFlattenedReviewCopy: async () => {
    const { workingBytes } = get();
    if (!workingBytes) return null;
    const annotations = useAnnotationStore.getState().annotations;
    const exportedBytes = await PdfEditAdapter.exportWithAnnotations(workingBytes, annotations);
    return exportedBytes;
  },

  downloadProcessedPdf: async () => {
    const { workingBytes } = get();
    return workingBytes;
  },
}));
