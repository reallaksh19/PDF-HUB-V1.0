export interface ViewState {
  currentPage: number;
  zoom: number;
}

export interface DocumentSession {
  fileId: string | null;
  fileName: string | null;
  pageCount: number;
  isDirty: boolean;
  viewState: ViewState;
}
