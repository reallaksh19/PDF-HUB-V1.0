import { create } from 'zustand';
import type { BBoxHit } from './types';

interface SearchState {
  hits: BBoxHit[];
  activeHitIndex: number;
  setHits: (hits: BBoxHit[]) => void;
  setActiveHitIndex: (index: number) => void;
  nextHit: () => void;
  prevHit: () => void;
  clearHits: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  hits: [],
  activeHitIndex: -1,

  setHits: (hits) => set({ hits, activeHitIndex: hits.length > 0 ? 0 : -1 }),
  setActiveHitIndex: (index) => set({ activeHitIndex: index }),

  nextHit: () => set((state) => {
    if (state.hits.length === 0) return state;
    return { activeHitIndex: (state.activeHitIndex + 1) % state.hits.length };
  }),

  prevHit: () => set((state) => {
    if (state.hits.length === 0) return state;
    return { activeHitIndex: (state.activeHitIndex - 1 + state.hits.length) % state.hits.length };
  }),

  clearHits: () => set({ hits: [], activeHitIndex: -1 }),
}));
