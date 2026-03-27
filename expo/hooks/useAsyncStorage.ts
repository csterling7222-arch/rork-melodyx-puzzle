import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Options for the useAsyncStorage hook
 * @template T - The type of value being stored
 */
interface UseAsyncStorageOptions<T> {
  /** Default value when no stored value exists */
  defaultValue: T;
  /** Custom serialization function (defaults to JSON.stringify) */
  serialize?: (value: T) => string;
  /** Custom deserialization function (defaults to JSON.parse) */
  deserialize?: (value: string) => T;
}

/**
 * Hook for managing AsyncStorage with React Query integration
 * Provides automatic caching, loading states, and mutation handling
 * 
 * @template T - The type of value being stored
 * @param key - The AsyncStorage key
 * @param options - Configuration options including default value and serializers
 * @returns Object containing value, setters, loading state, and error
 * 
 * @example
 * ```typescript
 * const { value, setValue, isLoading } = useAsyncStorage<User>('user', {
 *   defaultValue: null,
 * });
 * ```
 */
export function useAsyncStorage<T>(
  key: string,
  options: UseAsyncStorageOptions<T>
) {
  const { 
    defaultValue, 
    serialize = JSON.stringify, 
    deserialize = JSON.parse 
  } = options;
  
  const queryClient = useQueryClient();
  const queryKey = ['asyncStorage', key];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<T> => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null) {
          return deserialize(stored);
        }
        return defaultValue;
      } catch (e) {
        console.error(`[useAsyncStorage] Error reading ${key}:`, e);
        return defaultValue;
      }
    },
    staleTime: Infinity,
  });

  const { mutate: setValue, isPending: isSaving } = useMutation({
    mutationFn: async (newValue: T) => {
      const serialized = serialize(newValue);
      await AsyncStorage.setItem(key, serialized);
      return newValue;
    },
    onSuccess: (newValue) => {
      queryClient.setQueryData(queryKey, newValue);
    },
    onError: (error) => {
      console.error(`[useAsyncStorage] Error saving ${key}:`, error);
    },
  });

  const { mutate: removeValue } = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(key);
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKey, defaultValue);
    },
  });

  const updateValue = useCallback((updater: (prev: T) => T) => {
    const currentValue = data ?? defaultValue;
    const newValue = updater(currentValue);
    setValue(newValue);
  }, [data, defaultValue, setValue]);

  return {
    value: data ?? defaultValue,
    setValue,
    updateValue,
    removeValue,
    isLoading,
    isSaving,
    error,
    refetch,
  };
}

/**
 * Convenience hook for storing string values in AsyncStorage
 * Skips JSON serialization for better performance with strings
 * 
 * @param key - The AsyncStorage key
 * @param defaultValue - Default value when no stored value exists
 */
export function useAsyncStorageString(key: string, defaultValue: string = '') {
  return useAsyncStorage<string>(key, {
    defaultValue,
    serialize: (v) => v,
    deserialize: (v) => v,
  });
}

/**
 * Convenience hook for storing numeric values in AsyncStorage
 * Uses efficient string conversion for numbers
 * 
 * @param key - The AsyncStorage key
 * @param defaultValue - Default value when no stored value exists
 */
export function useAsyncStorageNumber(key: string, defaultValue: number = 0) {
  return useAsyncStorage<number>(key, {
    defaultValue,
    serialize: String,
    deserialize: Number,
  });
}

/**
 * Convenience hook for storing boolean values in AsyncStorage
 * Uses simple string representation for booleans
 * 
 * @param key - The AsyncStorage key
 * @param defaultValue - Default value when no stored value exists
 */
export function useAsyncStorageBoolean(key: string, defaultValue: boolean = false) {
  return useAsyncStorage<boolean>(key, {
    defaultValue,
    serialize: (v) => v ? 'true' : 'false',
    deserialize: (v) => v === 'true',
  });
}

/**
 * Convenience hook for storing object values in AsyncStorage
 * Uses JSON serialization (default behavior)
 * 
 * @template T - The object type
 * @param key - The AsyncStorage key
 * @param defaultValue - Default value when no stored value exists
 */
export function useAsyncStorageObject<T extends object>(key: string, defaultValue: T) {
  return useAsyncStorage<T>(key, { defaultValue });
}

/**
 * Convenience hook for storing array values in AsyncStorage
 * Provides additional array manipulation methods (push, remove, clear)
 * 
 * @template T - The array element type
 * @param key - The AsyncStorage key
 * @param defaultValue - Default value when no stored value exists
 * 
 * @example
 * ```typescript
 * const { value, push, remove, clear } = useAsyncStorageArray<Todo>('todos', []);
 * push({ id: '1', text: 'New todo' });
 * remove((todo) => todo.id === '1');
 * ```
 */
export function useAsyncStorageArray<T>(key: string, defaultValue: T[] = []) {
  const storage = useAsyncStorage<T[]>(key, { defaultValue });
  
  const push = useCallback((item: T) => {
    storage.updateValue((prev) => [...prev, item]);
  }, [storage]);

  const remove = useCallback((predicate: (item: T) => boolean) => {
    storage.updateValue((prev) => prev.filter((item) => !predicate(item)));
  }, [storage]);

  const clear = useCallback(() => {
    storage.setValue([]);
  }, [storage]);

  return {
    ...storage,
    push,
    remove,
    clear,
  };
}
