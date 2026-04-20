import { create } from 'zustand';
import { PdfAnnotation, AnnotationType } from './types';

export interface AnnotationState {
  annotations: PdfAnnotation[];
  history: PdfAnnotation[][];
  future: PdfAnnotation[][];
  activeAnnotationId: string | null;
}

export interface AnnotationActions {
  addAnnotation: (annotation: PdfAnnotation) => void;
  updateAnnotation: (id: string, data: Partial<PdfAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  setActiveAnnotationId: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  setAnnotations: (annotations: PdfAnnotation[]) => void;
}

const MAX_HISTORY = 50;

export const useAnnotationStore = create<AnnotationState & AnnotationActions>((set, get) => ({
  annotations: [],
  history: [],
  future: [],
  activeAnnotationId: null,

  addAnnotation: (ann) => set((state) => {
    const newHistory = [...state.history, state.annotations].slice(-MAX_HISTORY);
    return {
      annotations: [...state.annotations, ann],
      history: newHistory,
      future: [],
      activeAnnotationId: ann.id
    };
  }),

  updateAnnotation: (id, data) => set((state) => {
    const newHistory = [...state.history, state.annotations].slice(-MAX_HISTORY);
    return {
      annotations: state.annotations.map(a => (a.id === id ? { ...a, ...data, updatedAt: Date.now() } : a)),
      history: newHistory,
      future: []
    };
  }),

  deleteAnnotation: (id) => set((state) => {
    const newHistory = [...state.history, state.annotations].slice(-MAX_HISTORY);
    return {
      annotations: state.annotations.filter(a => a.id !== id),
      history: newHistory,
      future: [],
      activeAnnotationId: state.activeAnnotationId === id ? null : state.activeAnnotationId
    };
  }),

  setActiveAnnotationId: (id) => set({ activeAnnotationId: id }),

  undo: () => set((state) => {
    if (state.history.length === 0) return state;
    const previous = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    const newFuture = [state.annotations, ...state.future];
    return { annotations: previous, history: newHistory, future: newFuture };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    const newHistory = [...state.history, state.annotations];
    return { annotations: next, history: newHistory, future: newFuture };
  }),

  setAnnotations: (annotations) => set({ annotations, history: [], future: [] }),
}));
