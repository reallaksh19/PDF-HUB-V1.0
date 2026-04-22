import type { DocumentMutationTransaction } from './types';

export function createTransaction(
  commandType: string,
  beforeBytes: Uint8Array,
  beforePageCount: number,
  afterBytes: Uint8Array,
  afterPageCount: number,
): DocumentMutationTransaction {
  return {
    id: crypto.randomUUID(),
    commandType,
    timestamp: Date.now(),
    beforeBytes,
    beforePageCount,
    afterBytes,
    afterPageCount,
  };
}
