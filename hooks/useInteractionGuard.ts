import { useRef, useCallback, useEffect } from 'react';
import { Platform, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { logInteraction } from '@/utils/glitchFreeEngine';

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
  const tapCountRef = useRef<number>(0);
  const blockCountRef = useRef<number>(0);
  
  const preventDoubleTap = useCallback(<T>(callback: () => T, actionName?: string): (() => T | undefined) => {
    return () => {
      const now = Date.now();
      tapCountRef.current++;
      
      if (now - lastTapRef.current < delayMs) {
        blockCountRef.current++;
        console.log('[DoubleTapPrevention] Blocked double tap', actionName || '');
        logInteraction('double_tap_blocked', actionName || 'unknown', { 
          timeSinceLastTap: now - lastTapRef.current,
          blockCount: blockCountRef.current,
        });
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        return undefined;
      }
      lastTapRef.current = now;
      return callback();
    };
  }, [delayMs]);

  const getStats = useCallback(() => ({
    totalTaps: tapCountRef.current,
    blockedTaps: blockCountRef.current,
    blockRate: tapCountRef.current > 0 ? blockCountRef.current / tapCountRef.current : 0,
  }), []);

  return { preventDoubleTap, getStats };
}

export function useTransitionGuard() {
  const isTransitioningRef = useRef<boolean>(false);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const startTransition = useCallback((durationMs: number = 300, withFade: boolean = false) => {
    isTransitioningRef.current = true;
    
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    if (withFade) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: durationMs / 2,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
    
    transitionTimeoutRef.current = setTimeout(() => {
      isTransitioningRef.current = false;
      transitionTimeoutRef.current = null;
      
      if (withFade) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: durationMs / 2,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    }, durationMs);
    
    logInteraction('transition_started', 'screen', { durationMs, withFade });
  }, [fadeAnim]);

  const endTransition = useCallback(() => {
    isTransitioningRef.current = false;
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    fadeAnim.setValue(1);
  }, [fadeAnim]);

  const guardTransition = useCallback(<T>(callback: () => T, actionName?: string): (() => T | undefined) => {
    return () => {
      if (isTransitioningRef.current) {
        console.log('[TransitionGuard] Blocked: transition in progress', actionName || '');
        if (Platform.OS !== 'web') {
          Haptics.selectionAsync();
        }
        return undefined;
      }
      return callback();
    };
  }, []);

  const isTransitioning = useCallback(() => isTransitioningRef.current, []);

  return { startTransition, endTransition, guardTransition, isTransitioning, fadeAnim };
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

export function useScreenTransition() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const isEnteringRef = useRef(false);

  const animateIn = useCallback((delay: number = 0) => {
    if (isEnteringRef.current) return;
    isEnteringRef.current = true;
    
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const animateOut = useCallback((onComplete?: () => void) => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  }, [opacity, translateY]);

  const reset = useCallback(() => {
    isEnteringRef.current = false;
    opacity.setValue(0);
    translateY.setValue(20);
  }, [opacity, translateY]);

  useEffect(() => {
    animateIn();
  }, [animateIn]);

  return { 
    animatedStyle: { 
      opacity, 
      transform: [{ translateY }] 
    },
    animateIn,
    animateOut,
    reset,
  };
}

export function useAutoRedirect(
  condition: boolean,
  redirectFn: () => void,
  delayMs: number = 2000,
  enabled: boolean = true
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !condition || hasRedirectedRef.current) {
      return;
    }

    console.log('[AutoRedirect] Scheduling redirect in', delayMs, 'ms');
    logInteraction('auto_redirect_scheduled', 'screen', { delayMs });

    timerRef.current = setTimeout(() => {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        console.log('[AutoRedirect] Executing redirect');
        
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        redirectFn();
      }
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [condition, redirectFn, delayMs, enabled]);

  const cancelRedirect = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetRedirect = useCallback(() => {
    hasRedirectedRef.current = false;
  }, []);

  return { cancelRedirect, resetRedirect };
}

export function useSafeNavigation() {
  const isNavigatingRef = useRef(false);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { preventDoubleTap } = useDoubleTapPrevention(800);

  const safeNavigate = useCallback((navigateFn: () => void, screenName?: string) => {
    return preventDoubleTap(() => {
      if (isNavigatingRef.current) {
        console.log('[SafeNavigation] Blocked: navigation in progress');
        return;
      }

      isNavigatingRef.current = true;
      logInteraction('navigation', screenName || 'unknown');

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      navigateFn();

      navigationTimeoutRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    }, screenName);
  }, [preventDoubleTap]);

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  return { safeNavigate };
}
