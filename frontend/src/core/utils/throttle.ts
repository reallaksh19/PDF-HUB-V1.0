// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastRan: number = 0;
  let lastArgs: Parameters<T> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastThis: any = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    const remaining = limit - (now - lastRan);

    lastArgs = args;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastThis = this;

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastRan = now;
      func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastRan = Date.now();
        timeout = null;
        if (lastArgs) {
          func.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, remaining);
    }
  };
}
