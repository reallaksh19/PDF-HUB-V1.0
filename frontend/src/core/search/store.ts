import { create } from 'zustand';
import type { SearchHit, SearchState } from './types';

export interface SearchActions {
  setQuery: (query: string) => void;
  setResults: (results: SearchHit[]) => void;
  setActiveIndex: (index: number | null) => void;
  nextResult: () => void;
  previousResult: () => void;
  clearSearch: () => void;
  setSearching: (isSearching: boolean) => void;
}

export const useSearchStore = create<SearchState & SearchActions>((set) => ({
  query: '',
  results: [],
  activeIndex: null,
  isSearching: false,

  setQuery: (query) =>
    set((state) => {
      if (state.query === query) return {};
      return { query, activeIndex: null, results: query ? state.results : [] };
    }),

  setResults: (results) =>
    set({
      results,
      activeIndex: results.length > 0 ? 0 : null,
      isSearching: false,
    }),

  setActiveIndex: (index) =>
    set((state) => ({
      activeIndex:
        index === null
          ? null
          : Math.max(0, Math.min(index, state.results.length - 1)),
    })),

  nextResult: () =>
    set((state) => {
      if (state.results.length === 0) return {};
      const nextIndex =
        state.activeIndex === null
          ? 0
          : (state.activeIndex + 1) % state.results.length;
      return { activeIndex: nextIndex };
    }),

  previousResult: () =>
    set((state) => {
      if (state.results.length === 0) return {};
      const prevIndex =
        state.activeIndex === null
          ? state.results.length - 1
          : (state.activeIndex - 1 + state.results.length) % state.results.length;
      return { activeIndex: prevIndex };
    }),

  clearSearch: () =>
    set({
      query: '',
      results: [],
      activeIndex: null,
      isSearching: false,
    }),

  setSearching: (isSearching) => set({ isSearching }),
}));
