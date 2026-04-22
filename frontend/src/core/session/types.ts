export type FitMode = 'manual' | 'width' | 'page';
export type ViewMode = 'continuous' | 'single' | 'two-page';

export interface ViewState {
  currentPage: number;
  zoom: number;
  fitMode: FitMode;
  viewMode: ViewMode;
}

export type SaveExportActionType = 'save-working-document' | 'save-session-snapshot' | 'export-flattened-review' | 'download-processed-pdf';

export interface DocumentSession {
  documentKey: string | null;
  fileName: string | null;
  originalBytes: Uint8Array | null;
  workingBytes: Uint8Array | null;
  pageCount: number;
  isDirty: boolean;
  documentDirty: boolean;
  reviewDirty: boolean;
  sessionDirty: boolean;
  saveHandle: FileSystemFileHandle | null;
  selectedPages: number[];
  viewState: ViewState;
  lastExportAction?: {
    type: SaveExportActionType;
    timestamp: number;
  };
}