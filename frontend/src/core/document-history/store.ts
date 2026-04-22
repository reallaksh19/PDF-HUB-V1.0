import { create } from 'zustand';
import type { DocumentMutationTransaction } from './types';
import { useSessionStore } from '../session/store';

export interface HistoryState {
  past: DocumentMutationTransaction[];
  future: DocumentMutationTransaction[];
}

export interface HistoryActions {
  pushTransaction: (transaction: DocumentMutationTransaction) => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState & HistoryActions>((set, get) => ({
  past: [],
  future: [],

  pushTransaction: (transaction) => {
    set((state) => ({
      past: [...state.past, transaction],
      future: [], // Clear future on new transaction
    }));
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    useSessionStore.getState().replaceWorkingCopy(previous.beforeBytes, previous.beforePageCount);

    set({
      past: newPast,
      future: [previous, ...future],
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    useSessionStore.getState().replaceWorkingCopy(next.afterBytes, next.afterPageCount);

    set({
      past: [...past, next],
      future: newFuture,
    });
  },

  clearHistory: () => {
    set({ past: [], future: [] });
  },
}));
