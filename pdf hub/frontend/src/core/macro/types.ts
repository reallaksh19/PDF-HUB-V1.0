export type PageSelector =
  | { mode: 'all' }
  | { mode: 'current' }
  | { mode: 'selected' }
  | { mode: 'range'; from: number; to: number }
  | { mode: 'list'; pages: number[] }
  | { mode: 'odd' }
  | { mode: 'even' };

export type InsertPosition =
  | { mode: 'before'; page: number }
  | { mode: 'after'; page: number }
  | { mode: 'start' }
  | { mode: 'end' };

export type MacroStep =
  | { op: 'select_pages'; selector: PageSelector }
  | { op: 'merge_files'; donorFileIds: string[] }
  | { op: 'insert_pdf'; donorFileId: string; atIndex: number }
  | { op: 'extract_pages'; selector: PageSelector; outputName?: string }
  | { op: 'split_pages'; selector: PageSelector; outputName?: string }
  | { op: 'duplicate_pages'; selector: PageSelector }
  | { op: 'rotate_pages'; selector: PageSelector; degrees: 90 | 180 | 270 }
  | { op: 'remove_pages'; selector: PageSelector }
  | {
      op: 'insert_blank_page';
      position: InsertPosition;
      size: 'match-current' | 'a4' | 'letter' | { width: number; height: number };
      count?: number;
    }
  | {
      op: 'replace_page';
      targetPage: number;
      donorFileId: string;
      donorPage: number;
    }
  | {
      op: 'reorder_pages';
      order: number[];
    }
  | {
      op: 'header_footer_text';
      selector: PageSelector;
      zone: 'header' | 'footer';
      text: string;
      align: 'left' | 'center' | 'right';
      marginX: number;
      marginY: number;
      fontSize: number;
      color?: string;
      opacity?: number;
      excludeFirstPage?: boolean;
      excludeLastPage?: boolean;
      pageNumberToken?: boolean;
      fileNameToken?: boolean;
      dateToken?: boolean;
    }
  | {
      op: 'draw_text_on_pages';
      selector: PageSelector;
      text: string;
      x: number;
      y: number;
      fontSize: number;
      color?: string;
      opacity?: number;
      align?: 'left' | 'center' | 'right';
      pageNumberToken?: boolean;
      fileNameToken?: boolean;
      dateToken?: boolean;
    };

export interface MacroRecipe {
  id: string;
  name: string;
  dryRun?: boolean;
  steps: MacroStep[];
}

export interface MacroExecutionContext {
  workingBytes: Uint8Array;
  pageCount: number;
  selectedPages: number[];
  currentPage: number;
  fileName: string;
  donorFiles: Record<string, Uint8Array>;
  now: Date;
}

export interface MacroOutputFile {
  name: string;
  bytes: Uint8Array;
}

export interface MacroRunResult {
  workingBytes: Uint8Array;
  pageCount: number;
  selectedPages: number[];
  logs: string[];
  extractedOutputs: MacroOutputFile[];
  outputs?: MacroOutputFile[];
}
