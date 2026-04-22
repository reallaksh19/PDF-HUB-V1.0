export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SearchHit {
  id: string;
  pageNumber: number;
  text: string;
  rects: Rect[]; // Hit geometry (bounding boxes on the page)
}

export interface SearchState {
  query: string;
  results: SearchHit[];
  activeIndex: number | null;
  isSearching: boolean;
}
