import { describe, it, expect, vi } from 'vitest';
import { dispatchCommand } from '../dispatch';
import { useSessionStore } from '../../session/store';
import { useHistoryStore } from '../../document-history/store';

vi.mock('@/adapters/pdf-edit/PdfEditAdapter', () => ({
  PdfEditAdapter: {
    rotatePages: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    countPages: vi.fn().mockResolvedValue(5),
  }
}));

describe('dispatchCommand', () => {
  it('should push history and update session for ROTATE_PAGES', async () => {
    useSessionStore.getState().openDocument({
      documentKey: 'test',
      fileName: 'test.pdf',
      bytes: new Uint8Array([0]),
      pageCount: 1,
    });

    useHistoryStore.getState().clear();

    const result = await dispatchCommand({
      source: 'toolbar',
      workingBytes: new Uint8Array([0]),
      command: { type: 'ROTATE_PAGES', pageIndices: [0], angle: 90 }
    });

    expect(result.success).toBe(true);
    expect(result.nextPageCount).toBe(5);

    const history = useHistoryStore.getState().undoStack;
    expect(history.length).toBe(1);
    expect(history[0].command.type).toBe('ROTATE_PAGES');

    const session = useSessionStore.getState();
    expect(session.isDocumentDirty).toBe(true);
  });
});
