import { DocumentCommand } from '../commands/types';

export interface HistoryState {
  bytes: Uint8Array;
  pageCount: number;
}

export interface Transaction {
  id: string;
  command: DocumentCommand;
  timestamp: number;
  before: HistoryState;
  after: HistoryState;
}

export interface DocumentHistory {
  undoStack: Transaction[];
  redoStack: Transaction[];
}
