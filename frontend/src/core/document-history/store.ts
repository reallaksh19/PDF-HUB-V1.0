import { create } from 'zustand';
import type { DocumentTransaction } from './types';

export interface DocumentHistoryState {
  undoStack: DocumentTransaction[];
  redoStack: DocumentTransaction[];
}

export interface DocumentHistoryActions {
  pushTransaction: (transaction: DocumentTransaction) => void;
  popUndo: () => DocumentTransaction | null;
  pushUndo: (transaction: DocumentTransaction) => void;
  popRedo: () => DocumentTransaction | null;
  pushRedo: (transaction: DocumentTransaction) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

export const useDocumentHistoryStore = create<DocumentHistoryState & DocumentHistoryActions>((set, get) => ({
  undoStack: [],
  redoStack: [],

  pushTransaction: (transaction) =>
    set((state) => ({
      undoStack: [...state.undoStack, transaction],
      redoStack: [], // Clear redo stack on new action
    })),

  popUndo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;
    const transaction = undoStack[undoStack.length - 1];
    set({ undoStack: undoStack.slice(0, -1) });
    return transaction;
  },

  pushUndo: (transaction) =>
    set((state) => ({
      undoStack: [...state.undoStack, transaction],
    })),

  popRedo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return null;
    const transaction = redoStack[redoStack.length - 1];
    set({ redoStack: redoStack.slice(0, -1) });
    return transaction;
  },

  pushRedo: (transaction) =>
    set((state) => ({
      redoStack: [...state.redoStack, transaction],
    })),

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  clearHistory: () => set({ undoStack: [], redoStack: [] }),
}));
