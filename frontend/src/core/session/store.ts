import { create } from 'zustand';
import type { DocumentSession, FitMode, ViewMode, SaveExportActionType } from './types';

export interface OpenDocumentPayload {
  documentKey: string;
  fileName: string;
  bytes: Uint8Array;
  pageCount: number;
  saveHandle?: FileSystemFileHandle | null;
}

export interface SessionActions {
  openDocument: (payload: OpenDocumentPayload) => void;
  /** @deprecated use command bus to modify document */
  replaceWorkingCopy: (bytes: Uint8Array, pageCount: number) => void;
  setPage: (pageNumber: number) => void;
  setZoom: (zoom: number) => void;
  setFitMode: (fitMode: FitMode) => void;
  setViewMode: (viewMode: ViewMode) => void;

  setDirty: (isDirty: boolean) => void; // backward compatibility
  setDocumentDirty: (dirty: boolean) => void;
  setReviewDirty: (dirty: boolean) => void;
  setSessionDirty: (dirty: boolean) => void;

  setSaveHandle: (saveHandle: FileSystemFileHandle | null) => void;
  setSelectedPages: (pages: number[]) => void;
  toggleSelectedPage: (page: number) => void;
  clearSelectedPages: () => void;
  clearDocument: () => void;

  recordExportAction: (type: SaveExportActionType) => void;
}

function uniqSorted(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

export const useSessionStore = create<DocumentSession & SessionActions>((set) => ({
  documentKey: null,
  fileName: null,
  originalBytes: null,
  workingBytes: null,
  pageCount: 0,
  isDirty: false,
  documentDirty: false,
  reviewDirty: false,
  sessionDirty: false,
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
      isDirty: false,
      documentDirty: false,
      reviewDirty: false,
      sessionDirty: false,
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
      isDirty: true,
      documentDirty: true,
      sessionDirty: true,
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

  setDirty: (isDirty) => set({ isDirty, documentDirty: isDirty, sessionDirty: isDirty }),
  setDocumentDirty: (documentDirty) => set({ documentDirty, sessionDirty: true, isDirty: true }),
  setReviewDirty: (reviewDirty) => set({ reviewDirty, sessionDirty: true }),
  setSessionDirty: (sessionDirty) => set({ sessionDirty }),

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
      isDirty: false,
      documentDirty: false,
      reviewDirty: false,
      sessionDirty: false,
      saveHandle: null,
      selectedPages: [],
      viewState: {
        currentPage: 1,
        zoom: 100,
        fitMode: 'manual',
        viewMode: 'continuous',
      },
    }),

  recordExportAction: (type) =>
    set({
      lastExportAction: {
        type,
        timestamp: Date.now(),
      },
    }),
}));