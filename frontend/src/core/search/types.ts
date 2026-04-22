export interface SearchHitRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SearchHit {
  id: string;
  pageNumber: number;
  snippet: string;
  rects: SearchHitRect[];
}

export interface SearchState {
  query: string;
  isSearching: boolean;
  hits: SearchHit[];
  activeHitId: string | null;
}
