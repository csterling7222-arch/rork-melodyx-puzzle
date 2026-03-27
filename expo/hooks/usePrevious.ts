import { useRef, useEffect, useMemo } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export function usePreviousDistinct<T>(
  value: T,
  isEqual: (prev: T | undefined, current: T) => boolean = (a, b) => a === b
): T | undefined {
  const prevRef = useRef<T | undefined>(undefined);
  const currentRef = useRef<T>(value);

  if (!isEqual(currentRef.current, value)) {
    prevRef.current = currentRef.current;
    currentRef.current = value;
  }

  return prevRef.current;
}

export function useHasChanged<T>(value: T): boolean {
  const prevValue = usePrevious(value);
  return prevValue !== value;
}

export function useChangedProps<T extends Record<string, unknown>>(props: T): Partial<T> {
  const prevProps = usePrevious(props);
  
  return useMemo(() => {
    if (!prevProps) return props;
    
    const changed: Partial<T> = {};
    const allKeys = new Set([...Object.keys(prevProps), ...Object.keys(props)]);
    
    allKeys.forEach((key) => {
      if (prevProps[key] !== props[key]) {
        (changed as Record<string, unknown>)[key] = props[key];
      }
    });
    
    return changed;
  }, [props, prevProps]);
}

interface ValueHistory<T> {
  current: T;
  previous: T | undefined;
  history: T[];
  hasChanged: boolean;
}

export function useValueHistory<T>(value: T, maxHistory: number = 10): ValueHistory<T> {
  const historyRef = useRef<T[]>([]);
  const previous = usePrevious(value);
  const hasChanged = previous !== value;

  useEffect(() => {
    if (hasChanged && previous !== undefined) {
      historyRef.current = [previous, ...historyRef.current].slice(0, maxHistory);
    }
  }, [value, previous, hasChanged, maxHistory]);

  return useMemo(() => ({
    current: value,
    previous,
    history: historyRef.current,
    hasChanged,
  }), [value, previous, hasChanged]);
}
