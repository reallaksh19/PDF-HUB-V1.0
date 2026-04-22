export type DocumentCommand =
  | { type: 'rotate-pages'; pages: number[]; degrees: number }
  | { type: 'extract-pages'; pages: number[] }
  | { type: 'split-pages'; pages: number[] }
  | { type: 'duplicate-pages'; pages: number[] }
  | { type: 'delete-pages'; pages: number[] }
  | { type: 'insert-blank-page'; atIndex: number; size?: { width: number; height: number } }
  | { type: 'replace-page'; pages: number[] }
  | { type: 'add-page-numbers'; pages: number[] }
  | { type: 'add-header-footer'; pages: number[] }
  | { type: 'move-pages'; pages: number[]; targetIndex: number };

export interface CommandSource {
  source: string;
}

export interface CommandContext {
  [key: string]: unknown;
}

export interface CommandResult {
  success: boolean;
  [key: string]: unknown;
}
