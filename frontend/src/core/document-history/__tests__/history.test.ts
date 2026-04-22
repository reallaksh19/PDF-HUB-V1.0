import { describe, it, expect } from 'vitest';
import { useHistoryStore } from '../store';
import { applyUndo, applyRedo } from '../transactions';
import { useSessionStore } from '../../session/store';

describe('Document History', () => {
  it('should push, undo, and redo transactions', () => {
    const store = useHistoryStore.getState();
    store.clear();

    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);

    store.push({
      id: '1',
      command: { type: 'ROTATE_PAGES', pageIndices: [0], angle: 90 },
      timestamp: 0,
      before: { bytes: new Uint8Array([0]), pageCount: 1 },
      after: { bytes: new Uint8Array([1]), pageCount: 1 },
    });

    expect(useHistoryStore.getState().canUndo()).toBe(true);

    const undoTx = store.undo();
    expect(undoTx?.id).toBe('1');
    expect(useHistoryStore.getState().canUndo()).toBe(false);
    expect(useHistoryStore.getState().canRedo()).toBe(true);

    const redoTx = store.redo();
    expect(redoTx?.id).toBe('1');
    expect(useHistoryStore.getState().canUndo()).toBe(true);
    expect(useHistoryStore.getState().canRedo()).toBe(false);
  });

  it('should apply undo/redo to session store', () => {
    useHistoryStore.getState().clear();
    useSessionStore.getState().openDocument({
      documentKey: 'test',
      fileName: 'test.pdf',
      bytes: new Uint8Array([1, 2, 3]),
      pageCount: 1,
    });

    useHistoryStore.getState().push({
      id: '2',
      command: { type: 'ROTATE_PAGES', pageIndices: [0], angle: 90 },
      timestamp: 0,
      before: { bytes: new Uint8Array([1, 2, 3]), pageCount: 1 },
      after: { bytes: new Uint8Array([4, 5, 6]), pageCount: 1 },
    });

    applyUndo();
    expect(useSessionStore.getState().workingBytes).toEqual(new Uint8Array([1, 2, 3]));

    applyRedo();
    expect(useSessionStore.getState().workingBytes).toEqual(new Uint8Array([4, 5, 6]));
  });
});
