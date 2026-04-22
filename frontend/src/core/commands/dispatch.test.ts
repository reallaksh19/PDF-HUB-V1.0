import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchCommand } from './dispatch';
import { useSessionStore } from '../session/store';
import { useHistoryStore } from '../document-history/store';
import { PdfEditAdapter } from '@/adapters/pdf-edit/PdfEditAdapter';

vi.mock('@/adapters/pdf-edit/PdfEditAdapter', () => ({
  PdfEditAdapter: {
    rotatePages: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    countPages: vi.fn().mockResolvedValue(1),
  },
}));

describe('Command Dispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({
      workingBytes: new Uint8Array([0]),
      pageCount: 1,
      isDocumentDirty: false,
    });
    useHistoryStore.setState({
      past: [],
      future: [],
    });
  });

  it('should dispatch rotate-pages command and update state', async () => {
    const result = await dispatchCommand({
      type: 'rotate-pages',
      payload: {
        type: 'rotate-pages',
        source: 'toolbar',
        pageIndices: [0],
        deltaDegrees: 90,
      },
    });

    expect(result.success).toBe(true);
    expect(PdfEditAdapter.rotatePages).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      [0],
      90
    );

    const historyState = useHistoryStore.getState();
    expect(historyState.past.length).toBe(1);
    expect(historyState.past[0].commandType).toBe('rotate-pages');

    const sessionState = useSessionStore.getState();
    expect(sessionState.isDocumentDirty).toBe(true);
    expect(sessionState.workingBytes).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('should have command dispatch parity for different sources', async () => {
    const toolbarResult = await dispatchCommand({
      type: 'rotate-pages',
      payload: {
        type: 'rotate-pages',
        source: 'toolbar',
        pageIndices: [0],
        deltaDegrees: 90,
      },
    });

    useSessionStore.setState({ workingBytes: new Uint8Array([0]) });

    const macroResult = await dispatchCommand({
      type: 'rotate-pages',
      payload: {
        type: 'rotate-pages',
        source: 'macro-runner',
        pageIndices: [0],
        deltaDegrees: 90,
      },
    });

    expect(toolbarResult.bytes).toEqual(macroResult.bytes);
  });
});
