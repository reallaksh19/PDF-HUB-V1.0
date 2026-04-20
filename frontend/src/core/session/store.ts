import { create } from 'zustand';
import type { DocumentSession } from './types';

export type SessionState = DocumentSession;

export interface SessionActions {
  openDocument: (fileId: string, fileName: string, pageCount: number) => void;
  setPage: (pageNumber: number) => void;
  setZoom: (zoom: number) => void;
  setDirty: (isDirty: boolean) => void;
}

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  fileId: null,
  fileName: null,
  pageCount: 0,
  isDirty: false,
  viewState: {
    currentPage: 1,
    zoom: 100,
  },
  openDocument: (fileId, fileName, pageCount) =>
    set({
      fileId,
      fileName,
      pageCount,
      isDirty: false,
      viewState: { currentPage: 1, zoom: 100 },
    }),
  setPage: (currentPage) =>
    set((state) => ({
      viewState: { ...state.viewState, currentPage },
    })),
  setZoom: (zoom) =>
    set((state) => ({
      viewState: { ...state.viewState, zoom },
    })),
  setDirty: (isDirty) => set({ isDirty }),
}));
