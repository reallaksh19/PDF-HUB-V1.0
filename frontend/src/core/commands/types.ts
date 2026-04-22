export type CommandSource = 'toolbar' | 'thumbnail-menu' | 'macro-runner' | 'shortcut';

export type DocumentCommand =
  | { type: 'ROTATE_PAGES'; pageIndices: number[]; angle: number }
  | { type: 'REORDER_PAGES'; fromIndex: number; toIndex: number }
  | { type: 'EXTRACT_PAGES'; pageIndices: number[] }
  | { type: 'SPLIT_PAGES'; pageIndices: number[] }
  | { type: 'DELETE_PAGES'; pageIndices: number[] }
  | { type: 'INSERT_PAGES'; atIndex: number; newBytes: Uint8Array }
  | { type: 'INSERT_BLANK_PAGE'; atIndex: number; size: { width: number; height: number } }
  | { type: 'REPLACE_PAGE'; atIndex: number; donorBytes: Uint8Array; donorPageIndex: number }
  | { type: 'DUPLICATE_PAGES'; pageIndices: number[] }
  | { type: 'MERGE_PDF'; additionalBytes: Uint8Array[] };

export interface CommandPayload {
  command: DocumentCommand;
  source: CommandSource;
  workingBytes: Uint8Array;
}

export interface CommandResult {
  success: boolean;
  nextBytes?: Uint8Array;
  nextPageCount?: number;
  message?: string;
}

export interface CommandContext {
  currentPage: number;
  selectedPages: number[];
}
