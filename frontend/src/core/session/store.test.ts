import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './store';

describe('useSessionStore dirty state & export', () => {
  beforeEach(() => {
    useSessionStore.getState().clearDocument();
  });

  it('updates dirty states correctly', () => {
    const store = useSessionStore.getState();
    expect(store.documentDirty).toBe(false);
    expect(store.sessionDirty).toBe(false);

    useSessionStore.getState().setDocumentDirty(true);
    expect(useSessionStore.getState().documentDirty).toBe(true);
    expect(useSessionStore.getState().sessionDirty).toBe(true);

    useSessionStore.getState().setReviewDirty(true);
    expect(useSessionStore.getState().reviewDirty).toBe(true);
    // sessionDirty should also be true
    expect(useSessionStore.getState().sessionDirty).toBe(true);
  });

  it('records export action', () => {
    const store = useSessionStore.getState();
    expect(store.lastExportAction).toBeUndefined();

    store.recordExportAction('save-working-document');
    expect(useSessionStore.getState().lastExportAction?.type).toBe('save-working-document');
    expect(useSessionStore.getState().lastExportAction?.timestamp).toBeTypeOf('number');
  });
});
