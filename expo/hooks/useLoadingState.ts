import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  isSuccess: boolean;
}

interface UseLoadingStateReturn<T> extends LoadingState {
  execute: (asyncFn: () => Promise<T>) => Promise<T | undefined>;
  reset: () => void;
  data: T | null;
}

export function useLoadingState<T = unknown>(
  initialLoading: boolean = false
): UseLoadingStateReturn<T> {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const isMountedRef = useRef(true);

  const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T | undefined> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      const result = await asyncFn();
      if (isMountedRef.current) {
        setData(result);
        setIsSuccess(true);
        setIsLoading(false);
      }
      return result;
    } catch (e) {
      if (isMountedRef.current) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        setIsLoading(false);
      }
      return undefined;
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setIsSuccess(false);
    setData(null);
  }, []);

  return {
    isLoading,
    error,
    isSuccess,
    data,
    execute,
    reset,
  };
}

type LoadingKey = string;

interface MultiLoadingState {
  isLoading: (key: LoadingKey) => boolean;
  isAnyLoading: boolean;
  startLoading: (key: LoadingKey) => void;
  stopLoading: (key: LoadingKey) => void;
  setError: (key: LoadingKey, error: Error | null) => void;
  getError: (key: LoadingKey) => Error | null;
  reset: (key?: LoadingKey) => void;
}

export function useMultiLoadingState(): MultiLoadingState {
  const [loadingKeys, setLoadingKeys] = useState<Set<LoadingKey>>(new Set());
  const [errors, setErrors] = useState<Map<LoadingKey, Error>>(new Map());

  const isLoading = useCallback((key: LoadingKey) => {
    return loadingKeys.has(key);
  }, [loadingKeys]);

  const isAnyLoading = loadingKeys.size > 0;

  const startLoading = useCallback((key: LoadingKey) => {
    setLoadingKeys((prev) => new Set(prev).add(key));
    setErrors((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const stopLoading = useCallback((key: LoadingKey) => {
    setLoadingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const setError = useCallback((key: LoadingKey, error: Error | null) => {
    setErrors((prev) => {
      const next = new Map(prev);
      if (error) {
        next.set(key, error);
      } else {
        next.delete(key);
      }
      return next;
    });
    stopLoading(key);
  }, [stopLoading]);

  const getError = useCallback((key: LoadingKey) => {
    return errors.get(key) || null;
  }, [errors]);

  const reset = useCallback((key?: LoadingKey) => {
    if (key) {
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setErrors((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    } else {
      setLoadingKeys(new Set());
      setErrors(new Map());
    }
  }, []);

  return {
    isLoading,
    isAnyLoading,
    startLoading,
    stopLoading,
    setError,
    getError,
    reset,
  };
}

interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  backoff?: 'linear' | 'exponential';
}

export function useRetryableOperation<T>(options: RetryOptions) {
  const { maxRetries, retryDelay, backoff = 'linear' } = options;
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async (
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setIsRetrying(true);
          setRetryCount(attempt);
          const delay = backoff === 'exponential' 
            ? retryDelay * Math.pow(2, attempt - 1)
            : retryDelay * attempt;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await operation();
        setIsRetrying(false);
        setRetryCount(0);
        return result;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        console.log(`[useRetryableOperation] Attempt ${attempt + 1} failed:`, lastError.message);
        onRetry?.(attempt, lastError);
      }
    }
    
    setIsRetrying(false);
    throw lastError;
  }, [maxRetries, retryDelay, backoff]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    executeWithRetry,
    retryCount,
    isRetrying,
    reset,
  };
}
