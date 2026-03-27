import { useCallback, useMemo, useRef, useEffect } from 'react';

export function memoizeOne<T extends (...args: any[]) => any>(
  fn: T,
  isEqual: (prevArgs: Parameters<T>, nextArgs: Parameters<T>) => boolean = shallowEqualArrays
): T {
  let lastArgs: Parameters<T> | null = null;
  let lastResult: ReturnType<T>;

  return ((...args: Parameters<T>): ReturnType<T> => {
    if (lastArgs === null || !isEqual(lastArgs, args)) {
      lastArgs = args;
      lastResult = fn(...args) as ReturnType<T>;
    }
    return lastResult;
  }) as T;
}

export function shallowEqualArrays<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => 
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }

  return false;
}

export function useMemoCompare<T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean
): T {
  const previousRef = useRef<T | undefined>(undefined);
  const previous = previousRef.current;

  const isEqual = previous !== undefined && compare(previous, value);

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = value;
    }
  });

  return isEqual && previous !== undefined ? previous : value;
}

export function useStableCallback<T extends (...args: unknown[]) => unknown>(callback: T): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  );
}

export function useStableValue<T>(value: T): T {
  const ref = useRef(value);
  ref.current = value;
  return ref.current;
}

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  peakRenderTime: number;
}

export function useRenderMetrics(componentName: string): PerformanceMetrics {
  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    peakRenderTime: 0,
  });
  const totalTimeRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    
    metricsRef.current.renderCount++;
    metricsRef.current.lastRenderTime = renderTime;
    totalTimeRef.current += renderTime;
    metricsRef.current.averageRenderTime = totalTimeRef.current / metricsRef.current.renderCount;
    metricsRef.current.peakRenderTime = Math.max(metricsRef.current.peakRenderTime, renderTime);

    if (__DEV__ && renderTime > 16) {
      console.warn(`[Performance] ${componentName} slow render: ${renderTime.toFixed(2)}ms`);
    }

    startTimeRef.current = performance.now();
  });

  return metricsRef.current;
}

export function createLRUCache<K, V>(maxSize: number) {
  const cache = new Map<K, V>();

  return {
    get(key: K): V | undefined {
      if (!cache.has(key)) return undefined;
      const value = cache.get(key)!;
      cache.delete(key);
      cache.set(key, value);
      return value;
    },

    set(key: K, value: V): void {
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        const iterator = cache.keys();
        const firstKey = iterator.next();
        if (!firstKey.done && firstKey.value !== undefined) {
          cache.delete(firstKey.value);
        }
      }
      cache.set(key, value);
    },

    has(key: K): boolean {
      return cache.has(key);
    },

    delete(key: K): boolean {
      return cache.delete(key);
    },

    clear(): void {
      cache.clear();
    },

    get size(): number {
      return cache.size;
    },
  };
}

export function batchUpdates<T>(
  items: T[],
  batchSize: number,
  processBatch: (batch: T[], index: number) => void,
  delayMs: number = 0
): Promise<void> {
  return new Promise((resolve) => {
    let currentIndex = 0;

    const processNext = () => {
      const batch = items.slice(currentIndex, currentIndex + batchSize);
      if (batch.length === 0) {
        resolve();
        return;
      }

      processBatch(batch, currentIndex);
      currentIndex += batchSize;

      if (delayMs > 0) {
        setTimeout(processNext, delayMs);
      } else {
        requestAnimationFrame(processNext);
      }
    };

    processNext();
  });
}

export function measureExecutionTime<T>(
  fn: () => T,
  label?: string
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (__DEV__ && label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (__DEV__ && label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

export function useWhyDidYouUpdate<T extends Record<string, unknown>>(
  name: string,
  props: T
): void {
  const previousProps = useRef<T | undefined>(undefined);

  useEffect(() => {
    if (previousProps.current && __DEV__) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changesObj: Record<string, { from: unknown; to: unknown }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changesObj[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changesObj).length) {
        console.log(`[WhyDidYouUpdate] ${name}:`, changesObj);
      }
    }

    previousProps.current = props;
  });
}

export function useCustomDeferredValue<T>(value: T, delay: number = 100): T {
  const deferredRef = useRef<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useMemo(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      deferredRef.current = value;
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return deferredRef.current;
}
