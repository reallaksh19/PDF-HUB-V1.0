import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentHistoryStore } from './store';
import type { DocumentTransaction } from './types';

describe('useDocumentHistoryStore', () => {
  beforeEach(() => {
    useDocumentHistoryStore.getState().clearHistory();
  });

  const dummyTx: DocumentTransaction = {
    id: 'tx-1',
    timestamp: Date.now(),
    commandPayload: { type: 'ROTATE_PAGES', pageIndices: [0], degrees: 90 },
    previousBytes: new Uint8Array([1, 2, 3]),
    previousPageCount: 1,
    nextBytes: new Uint8Array([4, 5, 6]),
    nextPageCount: 1,
  };

  it('can push and pop transactions (undo)', () => {
    const store = useDocumentHistoryStore.getState();
    expect(store.canUndo()).toBe(false);

    store.pushTransaction(dummyTx);
    expect(useDocumentHistoryStore.getState().canUndo()).toBe(true);

    const popped = useDocumentHistoryStore.getState().popUndo();
    expect(popped).toEqual(dummyTx);
    expect(useDocumentHistoryStore.getState().canUndo()).toBe(false);
  });

  it('clears redo stack when new transaction is pushed', () => {
    const store = useDocumentHistoryStore.getState();
    store.pushTransaction(dummyTx);
    store.pushRedo(dummyTx); // manually simulate an existing redo
    expect(useDocumentHistoryStore.getState().canRedo()).toBe(true);

    store.pushTransaction({ ...dummyTx, id: 'tx-2' });
    expect(useDocumentHistoryStore.getState().canRedo()).toBe(false);
  });
});
