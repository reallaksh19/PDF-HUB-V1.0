import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSessionStore } from './store';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';

vi.mock('@/adapters/pdf-edit/PdfEditAdapter', () => ({
  PdfEditAdapter: {
    exportWithAnnotations: vi.fn().mockResolvedValue(new Uint8Array([9, 9, 9])),
  },
}));

vi.mock('../annotations/store', () => ({
  useAnnotationStore: {
    getState: vi.fn().mockReturnValue({ annotations: [] }),
  },
}));

describe('Session Store', () => {
  beforeEach(() => {
    useSessionStore.getState().clearDocument();
  });

  it('should initialize with correct default state', () => {
    const state = useSessionStore.getState();
    expect(state.isDocumentDirty).toBe(false);
    expect(state.isReviewDirty).toBe(false);
    expect(state.isSessionDirty).toBe(false);
  });

  it('should update dirty states', () => {
    useSessionStore.getState().setDocumentDirty(true);
    expect(useSessionStore.getState().isDocumentDirty).toBe(true);

    useSessionStore.getState().setReviewDirty(true);
    expect(useSessionStore.getState().isReviewDirty).toBe(true);

    useSessionStore.getState().setSessionDirty(true);
    expect(useSessionStore.getState().isSessionDirty).toBe(true);
  });

  it('should replace working copy and set document dirty', () => {
    useSessionStore.getState().replaceWorkingCopy(new Uint8Array([1, 2, 3]), 2);
    const state = useSessionStore.getState();
    expect(state.workingBytes).toEqual(new Uint8Array([1, 2, 3]));
    expect(state.pageCount).toBe(2);
    expect(state.isDocumentDirty).toBe(true);
  });

  it('saveWorkingDocument should clear document dirty state and return bytes', async () => {
    useSessionStore.setState({ workingBytes: new Uint8Array([1, 2, 3]), isDocumentDirty: true });
    const bytes = await useSessionStore.getState().saveWorkingDocument();
    expect(bytes).toEqual(new Uint8Array([1, 2, 3]));
    expect(useSessionStore.getState().isDocumentDirty).toBe(false);
  });

  it('saveSessionSnapshot should clear session dirty state', async () => {
    useSessionStore.setState({ isSessionDirty: true });
    await useSessionStore.getState().saveSessionSnapshot();
    expect(useSessionStore.getState().isSessionDirty).toBe(false);
  });

  it('exportFlattenedReviewCopy should use PdfEditAdapter', async () => {
    useSessionStore.setState({ workingBytes: new Uint8Array([1]) });
    const result = await useSessionStore.getState().exportFlattenedReviewCopy();
    expect(result).toEqual(new Uint8Array([9, 9, 9]));
    expect(PdfEditAdapter.exportWithAnnotations).toHaveBeenCalled();
  });

  it('downloadProcessedPdf should return working bytes', async () => {
    useSessionStore.setState({ workingBytes: new Uint8Array([5, 5, 5]) });
    const result = await useSessionStore.getState().downloadProcessedPdf();
    expect(result).toEqual(new Uint8Array([5, 5, 5]));
  });
});
