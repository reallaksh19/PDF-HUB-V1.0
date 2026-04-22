import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore } from './store';
import { useSessionStore } from '../session/store';

describe('Document History Store', () => {
  beforeEach(() => {
    useHistoryStore.setState({ past: [], future: [] });
    useSessionStore.setState({ workingBytes: new Uint8Array([0]), pageCount: 1 });
  });

  it('should push a transaction and clear future', () => {
    useHistoryStore.setState({ future: [{ id: '1', commandType: 'test', timestamp: 0, beforeBytes: new Uint8Array(), beforePageCount: 1, afterBytes: new Uint8Array(), afterPageCount: 1 }] });

    useHistoryStore.getState().pushTransaction({
      id: '2',
      commandType: 'rotate-pages',
      timestamp: 100,
      beforeBytes: new Uint8Array([0]),
      beforePageCount: 1,
      afterBytes: new Uint8Array([1]),
      afterPageCount: 1,
    });

    const state = useHistoryStore.getState();
    expect(state.past.length).toBe(1);
    expect(state.past[0].commandType).toBe('rotate-pages');
    expect(state.future.length).toBe(0);
  });

  it('should undo a transaction', () => {
    const transaction = {
      id: '1',
      commandType: 'rotate-pages',
      timestamp: 100,
      beforeBytes: new Uint8Array([0]),
      beforePageCount: 1,
      afterBytes: new Uint8Array([1]),
      afterPageCount: 1,
    };
    useHistoryStore.getState().pushTransaction(transaction);
    useSessionStore.setState({ workingBytes: new Uint8Array([1]) });

    useHistoryStore.getState().undo();

    const historyState = useHistoryStore.getState();
    expect(historyState.past.length).toBe(0);
    expect(historyState.future.length).toBe(1);
    expect(historyState.future[0]).toEqual(transaction);

    const sessionState = useSessionStore.getState();
    expect(sessionState.workingBytes).toEqual(new Uint8Array([0]));
  });

  it('should redo a transaction', () => {
    const transaction = {
      id: '1',
      commandType: 'rotate-pages',
      timestamp: 100,
      beforeBytes: new Uint8Array([0]),
      beforePageCount: 1,
      afterBytes: new Uint8Array([1]),
      afterPageCount: 1,
    };
    useHistoryStore.getState().pushTransaction(transaction);
    useHistoryStore.getState().undo();

    useHistoryStore.getState().redo();

    const historyState = useHistoryStore.getState();
    expect(historyState.past.length).toBe(1);
    expect(historyState.future.length).toBe(0);

    const sessionState = useSessionStore.getState();
    expect(sessionState.workingBytes).toEqual(new Uint8Array([1]));
  });
});
