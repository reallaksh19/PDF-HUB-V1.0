export interface DocumentMutationTransaction {
  id: string;
  commandType: string;
  timestamp: number;
  beforeBytes: Uint8Array;
  beforePageCount: number;
  afterBytes: Uint8Array;
  afterPageCount: number;
}
