import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UseAsyncStorageOptions<T> {
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

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

export function useAsyncStorageString(key: string, defaultValue: string = '') {
  return useAsyncStorage<string>(key, {
    defaultValue,
    serialize: (v) => v,
    deserialize: (v) => v,
  });
}

export function useAsyncStorageNumber(key: string, defaultValue: number = 0) {
  return useAsyncStorage<number>(key, {
    defaultValue,
    serialize: String,
    deserialize: Number,
  });
}

export function useAsyncStorageBoolean(key: string, defaultValue: boolean = false) {
  return useAsyncStorage<boolean>(key, {
    defaultValue,
    serialize: (v) => v ? 'true' : 'false',
    deserialize: (v) => v === 'true',
  });
}

export function useAsyncStorageObject<T extends object>(key: string, defaultValue: T) {
  return useAsyncStorage<T>(key, { defaultValue });
}

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
