export type FitMode = 'manual' | 'fit-width' | 'fit-page';
export type ViewMode = 'continuous' | 'single';

export interface ViewState {
  currentPage: number;
  zoom: number;
  fitMode: FitMode;
  viewMode: ViewMode;
}

export interface DocumentSession {
  documentKey: string | null;
  fileName: string | null;
  originalBytes: Uint8Array | null;
  workingBytes: Uint8Array | null;
  pageCount: number;
  isDocumentDirty: boolean;
  isReviewDirty: boolean;
  isSessionDirty: boolean;
  saveHandle: FileSystemFileHandle | null;
  selectedPages: number[];
  viewState: ViewState;
}
