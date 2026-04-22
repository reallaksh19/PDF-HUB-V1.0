import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dispatchCommand } from './dispatch';
import { useSessionStore } from '../session/store';
import { useDocumentHistoryStore } from '../document-history/store';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';

// Mock PdfEditAdapter methods we need
vi.mock('@/adapters/pdf-edit/PdfEditAdapter', () => ({
  PdfEditAdapter: {
    rotatePages: vi.fn().mockResolvedValue(new Uint8Array([9, 9])),
    countPages: vi.fn().mockResolvedValue(1),
    removePages: vi.fn().mockResolvedValue(new Uint8Array([8, 8])),
    addHeaderFooterText: vi.fn().mockResolvedValue(new Uint8Array([7, 7])), // if needed later
    extractPages: vi.fn().mockResolvedValue(new Uint8Array([6, 6])),
  }
}));

// Mock executeMacroRecipe
vi.mock('../macro/executor', () => ({
  executeMacroRecipe: vi.fn().mockResolvedValue({
    workingBytes: new Uint8Array([10, 10]),
    pageCount: 1,
    extractedOutputs: []
  })
}));

describe('dispatchCommand', () => {
  const mockBytes = new Uint8Array([1, 2, 3]);

  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.getState().clearDocument();
    useDocumentHistoryStore.getState().clearHistory();

    // Setup initial session
    useSessionStore.getState().openDocument({
      documentKey: 'test-doc',
      fileName: 'test.pdf',
      bytes: mockBytes,
      pageCount: 1,
    });
  });

  it('fails if no document is active', async () => {
    useSessionStore.getState().clearDocument();
    const result = await dispatchCommand({
      payload: { type: 'ROTATE_PAGES', pageIndices: [0], degrees: 90 },
      context: { source: 'toolbar', timestamp: Date.now() }
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('No active document');
  });

  it('dispatches rotate, pushes to history, and updates session', async () => {
    const result = await dispatchCommand({
      payload: { type: 'ROTATE_PAGES', pageIndices: [0], degrees: 90 },
      context: { source: 'toolbar', timestamp: Date.now() }
    });

    expect(result.success).toBe(true);
    expect(PdfEditAdapter.rotatePages).toHaveBeenCalledWith(mockBytes, [0], 90);

    // Check session
    expect(useSessionStore.getState().workingBytes).toEqual(new Uint8Array([9, 9]));
    expect(useSessionStore.getState().documentDirty).toBe(true);

    // Check history
    expect(useDocumentHistoryStore.getState().canUndo()).toBe(true);
  });

  it('can undo and redo', async () => {
    await dispatchCommand({
      payload: { type: 'ROTATE_PAGES', pageIndices: [0], degrees: 90 },
      context: { source: 'toolbar', timestamp: Date.now() }
    });

    expect(useSessionStore.getState().workingBytes).toEqual(new Uint8Array([9, 9]));

    // UNDO
    const undoResult = await dispatchCommand({
      payload: { type: 'UNDO' },
      context: { source: 'toolbar', timestamp: Date.now() }
    });

    expect(undoResult.success).toBe(true);
    expect(useSessionStore.getState().workingBytes).toEqual(mockBytes); // Back to original
    expect(useDocumentHistoryStore.getState().canUndo()).toBe(false);
    expect(useDocumentHistoryStore.getState().canRedo()).toBe(true);

    // REDO
    const redoResult = await dispatchCommand({
      payload: { type: 'REDO' },
      context: { source: 'toolbar', timestamp: Date.now() }
    });

    expect(redoResult.success).toBe(true);
    expect(useSessionStore.getState().workingBytes).toEqual(new Uint8Array([9, 9]));
    expect(useDocumentHistoryStore.getState().canRedo()).toBe(false);
  });

  it('handles split_pages mutating and returning extracted bytes', async () => {
    const result = await dispatchCommand({
      payload: { type: 'SPLIT_PAGES', pageIndices: [0] },
      context: { source: 'toolbar', timestamp: Date.now() }
    });

    expect(result.success).toBe(true);
    expect(PdfEditAdapter.extractPages).toHaveBeenCalledWith(mockBytes, [0]);
    expect(PdfEditAdapter.removePages).toHaveBeenCalledWith(mockBytes, [0]);
    expect(result.extractedOutputs).toHaveLength(1);
    expect(result.extractedOutputs?.[0].bytes).toEqual(new Uint8Array([6, 6]));

    // Check mutates
    expect(useSessionStore.getState().workingBytes).toEqual(new Uint8Array([8, 8]));
  });
});
