import { describe, it, expect, beforeEach } from 'vitest';
import { useFeedbackStore } from './store';

describe('Feedback Store', () => {
  beforeEach(() => {
    useFeedbackStore.setState({ toasts: [], progressTasks: [] });
  });

  it('should add and dismiss a toast', () => {
    const { showToast, dismissToast } = useFeedbackStore.getState();
    const id = showToast({ kind: 'success', message: 'Test success' });

    expect(useFeedbackStore.getState().toasts).toHaveLength(1);
    expect(useFeedbackStore.getState().toasts[0].message).toBe('Test success');

    dismissToast(id);
    expect(useFeedbackStore.getState().toasts).toHaveLength(0);
  });

  it('should manage progress tasks', () => {
    const { startProgress, updateProgress, stopProgress } = useFeedbackStore.getState();
    const taskId = 'task1';

    startProgress(taskId, 'Starting...');
    expect(useFeedbackStore.getState().progressTasks).toHaveLength(1);
    expect(useFeedbackStore.getState().progressTasks[0].message).toBe('Starting...');

    updateProgress(taskId, 50, 'Halfway there');
    expect(useFeedbackStore.getState().progressTasks[0].progress).toBe(50);
    expect(useFeedbackStore.getState().progressTasks[0].message).toBe('Halfway there');

    stopProgress(taskId);
    expect(useFeedbackStore.getState().progressTasks).toHaveLength(0);
  });
});
