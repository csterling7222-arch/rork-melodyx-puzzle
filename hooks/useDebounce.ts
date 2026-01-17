import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    
    if (now - lastUpdated.current >= interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - (now - lastUpdated.current));

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  interval: number
): T {
  const lastCalledRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCalledRef.current;

    if (timeSinceLastCall >= interval) {
      lastCalledRef.current = now;
      callbackRef.current(...args);
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        lastCalledRef.current = Date.now();
        timeoutRef.current = null;
        callbackRef.current(...args);
      }, interval - timeSinceLastCall);
    }
  }, [interval]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

interface DebouncedState<T> {
  value: T;
  isPending: boolean;
}

export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [DebouncedState<T>, (value: T) => void, () => void] {
  const [state, setState] = useState<T>(initialValue);
  const [debouncedState, setDebouncedState] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setValue = useCallback((value: T) => {
    setState(value);
    setIsPending(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedState(value);
      setIsPending(false);
    }, delay);
  }, [delay]);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDebouncedState(state);
    setIsPending(false);
  }, [state]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const result = useMemo(() => ({
    value: debouncedState,
    isPending,
  }), [debouncedState, isPending]);

  return [result, setValue, flush];
}
