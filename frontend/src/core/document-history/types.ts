import { DocumentCommandPayload } from '../commands/types';

export interface DocumentTransaction {
  id: string;
  timestamp: number;
  commandPayload: DocumentCommandPayload;

  // State before the command
  previousBytes: Uint8Array;
  previousPageCount: number;

  // State after the command
  nextBytes: Uint8Array;
  nextPageCount: number;
}
