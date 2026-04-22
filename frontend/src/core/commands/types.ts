export type CommandSource = 'toolbar' | 'thumbnail-menu' | 'macro-runner' | 'keyboard-shortcut';

export type CommandType =
  | 'rotate-pages'
  | 'extract-pages'
  | 'split-document'
  | 'delete-pages'
  | 'insert-page'
  | 'replace-page'
  | 'add-header-footer'
  | 'batch-text'
  | 'reorder-pages'
  | 'duplicate-pages'
  | 'move-page';

export interface BaseCommandPayload {
  source: CommandSource;
  documentId?: string;
}

export interface RotatePagesPayload extends BaseCommandPayload {
  pageIndices: number[];
  deltaDegrees: number;
}

export interface ExtractPagesPayload extends BaseCommandPayload {
  pageIndices: number[];
}

export interface DeletePagesPayload extends BaseCommandPayload {
  pageIndices: number[];
}

export interface ReorderPagesPayload extends BaseCommandPayload {
  order: number[];
}

export interface MovePagePayload extends BaseCommandPayload {
  fromIndex: number;
  toIndex: number;
}

export interface DuplicatePagesPayload extends BaseCommandPayload {
  pageIndices: number[];
}

export interface InsertPagePayload extends BaseCommandPayload {
  atIndex: number;
  insertBytes: Uint8Array;
}

export interface ReplacePagePayload extends BaseCommandPayload {
  targetIndex: number;
  donorBytes: Uint8Array;
  donorPageIndex: number;
}

export interface SplitDocumentPayload extends BaseCommandPayload {
  splitIndex: number;
}

export interface BatchTextPayload extends BaseCommandPayload {
  texts: string[];
}

export interface AddHeaderFooterPayload extends BaseCommandPayload {
  options: {
    pages: number[];
    zone: 'header' | 'footer';
    text: string;
    align: 'left' | 'center' | 'right';
    marginX: number;
    marginY: number;
    fontSize: number;
    color: string;
    opacity: number;
    fileName: string;
    now: Date;
    enablePageNumberToken: boolean;
    enableFileNameToken: boolean;
    enableDateToken: boolean;
  };
}

export type CommandPayload =
  | ({ type: 'rotate-pages' } & RotatePagesPayload)
  | ({ type: 'extract-pages' } & ExtractPagesPayload)
  | ({ type: 'delete-pages' } & DeletePagesPayload)
  | ({ type: 'reorder-pages' } & ReorderPagesPayload)
  | ({ type: 'move-page' } & MovePagePayload)
  | ({ type: 'duplicate-pages' } & DuplicatePagesPayload)
  | ({ type: 'insert-page' } & InsertPagePayload)
  | ({ type: 'replace-page' } & ReplacePagePayload)
  | ({ type: 'add-header-footer' } & AddHeaderFooterPayload)
  | ({ type: 'split-document' } & SplitDocumentPayload)
  | ({ type: 'batch-text' } & BatchTextPayload);

export interface DocumentCommand {
  type: CommandType;
  payload: CommandPayload;
}

export interface CommandResult {
  success: boolean;
  error?: string;
  bytes?: Uint8Array;
  pageCount?: number;
}

export interface CommandContext {
  workingBytes: Uint8Array;
  pageCount: number;
}
