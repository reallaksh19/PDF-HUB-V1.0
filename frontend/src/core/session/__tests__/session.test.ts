import { describe, it, expect } from 'vitest';
import { useSessionStore } from '../store';

describe('Session Store', () => {
  it('tracks dirty states and save actions', () => {
    const store = useSessionStore.getState();
    store.openDocument({
      documentKey: 'doc1',
      fileName: 'doc1.pdf',
      bytes: new Uint8Array([1]),
      pageCount: 1,
    });

    expect(useSessionStore.getState().isDocumentDirty).toBe(false);
    expect(useSessionStore.getState().isReviewDirty).toBe(false);
    expect(useSessionStore.getState().isSessionDirty).toBe(false);

    useSessionStore.getState().setDocumentDirty(true);
    expect(useSessionStore.getState().isDocumentDirty).toBe(true);

    useSessionStore.getState().recordSaveExportAction({ type: 'SAVE_WORKING_DOCUMENT' });
    expect(useSessionStore.getState().lastExportAction?.type).toBe('SAVE_WORKING_DOCUMENT');
  });
});
