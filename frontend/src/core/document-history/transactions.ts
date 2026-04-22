import { useSessionStore } from '../session/store';
import { useHistoryStore } from './store';

export function applyUndo() {
  const transaction = useHistoryStore.getState().undo();
  if (transaction) {
    const { before } = transaction;
    useSessionStore.getState().replaceWorkingCopy(before.bytes, before.pageCount);
    // Explicitly set isDocumentDirty since replaceWorkingCopy automatically sets it to true,
    // but what if we undo back to the clean state?
    // In a real app we might check if undoStack is empty or similar logic.
    // We'll rely on the save logic to clear it.
  }
}

export function applyRedo() {
  const transaction = useHistoryStore.getState().redo();
  if (transaction) {
    const { after } = transaction;
    useSessionStore.getState().replaceWorkingCopy(after.bytes, after.pageCount);
  }
}
