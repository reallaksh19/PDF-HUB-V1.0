import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttle } from './throttle';

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should execute immediately on the first call', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it('should ignore subsequent calls within the limit', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn(1);
    throttledFn(2);
    throttledFn(3);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1);
  });

  it('should execute on the trailing edge with the latest arguments', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn(1); // Executes immediately
    throttledFn(2); // Ignored, schedules trailing edge
    throttledFn(3); // Updates trailing edge arguments

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(3);
  });

  it('should reset properly after the timeout', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn(1); // T: 0
    vi.advanceTimersByTime(101);
    throttledFn(2); // T: 101, should execute immediately again

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 1);
    expect(fn).toHaveBeenNthCalledWith(2, 2);
  });
});
