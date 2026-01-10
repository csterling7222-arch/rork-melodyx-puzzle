import { useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface InteractionGuardOptions {
  debounceMs?: number;
  hapticOnBlock?: boolean;
  onBlocked?: () => void;
}

const DEFAULT_DEBOUNCE_MS = 300;

export function useInteractionGuard(options: InteractionGuardOptions = {}) {
  const { 
    debounceMs = DEFAULT_DEBOUNCE_MS, 
    hapticOnBlock = false,
    onBlocked,
  } = options;
  
  const lastInteractionRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  const guard = useCallback(<T extends (...args: unknown[]) => unknown>(
    callback: T
  ): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      const now = Date.now();
      
      if (isProcessingRef.current) {
        console.log('[InteractionGuard] Blocked: still processing');
        if (hapticOnBlock && Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        onBlocked?.();
        return undefined;
      }
      
      if (now - lastInteractionRef.current < debounceMs) {
        console.log('[InteractionGuard] Blocked: debounce active');
        if (hapticOnBlock && Platform.OS !== 'web') {
          Haptics.selectionAsync();
        }
        onBlocked?.();
        return undefined;
      }
      
      lastInteractionRef.current = now;
      return callback(...args) as ReturnType<T>;
    };
  }, [debounceMs, hapticOnBlock, onBlocked]);

  const guardAsync = useCallback(<T extends (...args: unknown[]) => Promise<unknown>>(
    callback: T
  ): ((...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | undefined>) => {
    return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | undefined> => {
      const now = Date.now();
      
      if (isProcessingRef.current) {
        console.log('[InteractionGuard] Blocked: async operation in progress');
        if (hapticOnBlock && Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        onBlocked?.();
        return undefined;
      }
      
      if (now - lastInteractionRef.current < debounceMs) {
        console.log('[InteractionGuard] Blocked: debounce active');
        onBlocked?.();
        return undefined;
      }
      
      lastInteractionRef.current = now;
      isProcessingRef.current = true;
      
      try {
        const result = await callback(...args);
        return result as Awaited<ReturnType<T>>;
      } finally {
        isProcessingRef.current = false;
      }
    };
  }, [debounceMs, hapticOnBlock, onBlocked]);

  const reset = useCallback(() => {
    lastInteractionRef.current = 0;
    isProcessingRef.current = false;
  }, []);

  const isBlocked = useCallback(() => {
    const now = Date.now();
    return isProcessingRef.current || (now - lastInteractionRef.current < debounceMs);
  }, [debounceMs]);

  return { guard, guardAsync, reset, isBlocked };
}

export function useDoubleTapPrevention(delayMs: number = 500) {
  const lastTapRef = useRef<number>(0);
  
  const preventDoubleTap = useCallback(<T>(callback: () => T): (() => T | undefined) => {
    return () => {
      const now = Date.now();
      if (now - lastTapRef.current < delayMs) {
        console.log('[DoubleTapPrevention] Blocked double tap');
        return undefined;
      }
      lastTapRef.current = now;
      return callback();
    };
  }, [delayMs]);

  return { preventDoubleTap };
}

export function useTransitionGuard() {
  const isTransitioningRef = useRef<boolean>(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTransition = useCallback((durationMs: number = 300) => {
    isTransitioningRef.current = true;
    
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      isTransitioningRef.current = false;
      transitionTimeoutRef.current = null;
    }, durationMs);
  }, []);

  const endTransition = useCallback(() => {
    isTransitioningRef.current = false;
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
  }, []);

  const guardTransition = useCallback(<T>(callback: () => T): (() => T | undefined) => {
    return () => {
      if (isTransitioningRef.current) {
        console.log('[TransitionGuard] Blocked: transition in progress');
        return undefined;
      }
      return callback();
    };
  }, []);

  const isTransitioning = useCallback(() => isTransitioningRef.current, []);

  return { startTransition, endTransition, guardTransition, isTransitioning };
}

export function createThrottledHandler<T extends (...args: unknown[]) => unknown>(
  handler: T,
  limitMs: number = 100
): T {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    lastArgs = args;

    if (now - lastCall >= limitMs) {
      lastCall = now;
      return handler(...args);
    }

    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        if (lastArgs) {
          handler(...lastArgs);
        }
      }, limitMs - (now - lastCall));
    }
  }) as T;
}

export function useBatchedUpdates<T>(
  updateFn: (items: T[]) => void,
  batchDelayMs: number = 16
) {
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToBatch = useCallback((item: T) => {
    batchRef.current.push(item);

    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        const batch = [...batchRef.current];
        batchRef.current = [];
        timeoutRef.current = null;
        updateFn(batch);
      }, batchDelayMs);
    }
  }, [updateFn, batchDelayMs]);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (batchRef.current.length > 0) {
      const batch = [...batchRef.current];
      batchRef.current = [];
      updateFn(batch);
    }
  }, [updateFn]);

  return { addToBatch, flush };
}
