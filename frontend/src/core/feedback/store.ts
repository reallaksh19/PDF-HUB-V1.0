import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  message: string;
  persistent?: boolean;
  ttlMs?: number;
}

export interface ProgressState {
  id: string;
  message: string;
  progress?: number; // 0-100, undefined for indeterminate
}

export interface FeedbackState {
  toasts: ToastMessage[];
  progressTasks: ProgressState[];
}

export interface FeedbackActions {
  showToast: (toast: Omit<ToastMessage, 'id'>) => string;
  dismissToast: (id: string) => void;
  startProgress: (id: string, message: string) => void;
  updateProgress: (id: string, progress: number, message?: string) => void;
  stopProgress: (id: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useFeedbackStore = create<FeedbackState & FeedbackActions>((set) => ({
  toasts: [],
  progressTasks: [],

  showToast: (toast) => {
    const id = generateId();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  startProgress: (id, message) =>
    set((state) => {
      if (state.progressTasks.some((t) => t.id === id)) return state;
      return {
        progressTasks: [...state.progressTasks, { id, message }],
      };
    }),

  updateProgress: (id, progress, message) =>
    set((state) => ({
      progressTasks: state.progressTasks.map((t) =>
        t.id === id ? { ...t, progress, message: message ?? t.message } : t
      ),
    })),

  stopProgress: (id) =>
    set((state) => ({
      progressTasks: state.progressTasks.filter((t) => t.id !== id),
    })),
}));
