import type { MacroRecipe } from '../macro/types';

export type CommandSource = 'toolbar' | 'thumbnail-menu' | 'macro-runner' | 'keyboard-shortcut';

export interface CommandContext {
  source: CommandSource;
  timestamp: number;
}

export interface RotatePagesPayload {
  type: 'ROTATE_PAGES';
  pageIndices: number[];
  degrees: number;
}

export interface DeletePagesPayload {
  type: 'DELETE_PAGES';
  pageIndices: number[];
}

export interface InsertBlankPagePayload {
  type: 'INSERT_BLANK_PAGE';
  atIndex: number;
  size: { width: number; height: number };
}

export interface ReplacePagePayload {
  type: 'REPLACE_PAGE';
  targetPageIndex: number;
  donorBytes: Uint8Array;
  donorPageIndex: number;
}

export interface DuplicatePagesPayload {
  type: 'DUPLICATE_PAGES';
  pageIndices: number[];
}

export interface ExtractPagesPayload {
  type: 'EXTRACT_PAGES';
  pageIndices: number[];
  // Does not mutate the document, just returns a new one
}

export interface SplitPagesPayload {
  type: 'SPLIT_PAGES';
  pageIndices: number[];
  // Mutates by removing, and returns extracted
}

export interface MergeFilesPayload {
  type: 'MERGE_FILES';
  donorBytesList: Uint8Array[];
}

export interface InsertFromPdfPayload {
  type: 'INSERT_FROM_PDF';
  donorBytes: Uint8Array;
  atIndex: number;
}

export interface ReorderPagesPayload {
  type: 'REORDER_PAGES';
  order: number[];
}

export interface ApplyMacroPayload {
  type: 'APPLY_MACRO';
  recipe: MacroRecipe;
  donorFiles?: Record<string, Uint8Array>;
}

export interface UndoPayload {
  type: 'UNDO';
}

export interface RedoPayload {
  type: 'REDO';
}

export type DocumentCommandPayload =
  | RotatePagesPayload
  | DeletePagesPayload
  | InsertBlankPagePayload
  | ReplacePagePayload
  | DuplicatePagesPayload
  | ExtractPagesPayload
  | SplitPagesPayload
  | MergeFilesPayload
  | InsertFromPdfPayload
  | ReorderPagesPayload
  | ApplyMacroPayload
  | UndoPayload
  | RedoPayload;

export interface DocumentCommand {
  payload: DocumentCommandPayload;
  context: CommandContext;
}

export interface CommandResult {
  success: boolean;
  workingBytes?: Uint8Array;
  pageCount?: number;
  error?: string;
  extractedOutputs?: Array<{ name: string; bytes: Uint8Array }>;
}
