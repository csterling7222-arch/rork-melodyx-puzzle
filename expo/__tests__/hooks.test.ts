import { 
  createLRUCache, 
  shallowEqual, 
  shallowEqualArrays, 
  deepEqual,
  memoizeOne,
  measureExecutionTime,
  batchUpdates,
} from '../utils/performanceUtils';

describe('Performance Utils', () => {
  describe('shallowEqualArrays', () => {
    it('should return true for identical arrays', () => {
      const arr = [1, 2, 3];
      expect(shallowEqualArrays(arr, arr)).toBe(true);
    });

    it('should return true for equal arrays', () => {
      expect(shallowEqualArrays([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it('should return false for arrays with different lengths', () => {
      expect(shallowEqualArrays([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should return false for arrays with different values', () => {
      expect(shallowEqualArrays([1, 2, 3], [1, 2, 4])).toBe(false);
    });

    it('should handle empty arrays', () => {
      expect(shallowEqualArrays([], [])).toBe(true);
    });

    it('should compare by reference for objects', () => {
      const obj = { a: 1 };
      expect(shallowEqualArrays([obj], [obj])).toBe(true);
      expect(shallowEqualArrays([{ a: 1 }], [{ a: 1 }])).toBe(false);
    });
  });

  describe('shallowEqual', () => {
    it('should return true for same reference', () => {
      const obj = { a: 1, b: 2 };
      expect(shallowEqual(obj, obj)).toBe(true);
    });

    it('should return true for equal objects', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('should return false for objects with different keys', () => {
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should return false for objects with different values', () => {
      expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('should handle empty objects', () => {
      expect(shallowEqual({}, {})).toBe(true);
    });

    it('should not deep compare nested objects', () => {
      expect(shallowEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false);
    });
  });

  describe('deepEqual', () => {
    it('should return true for same primitive values', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('a', 'a')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
    });

    it('should return false for different primitive values', () => {
      expect(deepEqual(1, 2)).toBe(false);
      expect(deepEqual('a', 'b')).toBe(false);
    });

    it('should handle null values', () => {
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(null, undefined)).toBe(false);
    });

    it('should deep compare arrays', () => {
      expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
      expect(deepEqual([1, [2, 3]], [1, [2, 4]])).toBe(false);
    });

    it('should deep compare objects', () => {
      expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(true);
      expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } })).toBe(false);
    });

    it('should handle mixed nested structures', () => {
      const obj1 = { arr: [1, { nested: true }], value: 'test' };
      const obj2 = { arr: [1, { nested: true }], value: 'test' };
      expect(deepEqual(obj1, obj2)).toBe(true);
    });
  });

  describe('memoizeOne', () => {
    it('should memoize function results', () => {
      let callCount = 0;
      const fn = (a: number, b: number): number => {
        callCount++;
        return a + b;
      };
      const memoized = memoizeOne(fn);

      expect(memoized(1, 2)).toBe(3);
      expect(callCount).toBe(1);
      
      expect(memoized(1, 2)).toBe(3);
      expect(callCount).toBe(1);
    });

    it('should recompute when arguments change', () => {
      let callCount = 0;
      const fn = (a: number, b: number): number => {
        callCount++;
        return a + b;
      };
      const memoized = memoizeOne(fn);

      expect(memoized(1, 2)).toBe(3);
      expect(callCount).toBe(1);
      
      expect(memoized(2, 3)).toBe(5);
      expect(callCount).toBe(2);
    });

    it('should only remember last call', () => {
      let callCount = 0;
      const fn = (a: number): number => {
        callCount++;
        return a * 2;
      };
      const memoized = memoizeOne(fn);

      expect(memoized(1)).toBe(2);
      expect(memoized(2)).toBe(4);
      expect(memoized(1)).toBe(2);
      expect(callCount).toBe(3);
    });
  });

  describe('createLRUCache', () => {
    it('should store and retrieve values', () => {
      const cache = createLRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
    });

    it('should evict least recently used item when full', () => {
      const cache = createLRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
    });

    it('should update LRU order on get', () => {
      const cache = createLRUCache<string, number>(2);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.get('a');
      cache.set('c', 3);
      
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
    });

    it('should report size correctly', () => {
      const cache = createLRUCache<string, number>(5);
      expect(cache.size).toBe(0);
      
      cache.set('a', 1);
      expect(cache.size).toBe(1);
      
      cache.set('b', 2);
      expect(cache.size).toBe(2);
    });

    it('should clear all items', () => {
      const cache = createLRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      
      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
    });

    it('should delete specific items', () => {
      const cache = createLRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.delete('a');
      
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
    });

    it('should check if key exists', () => {
      const cache = createLRUCache<string, number>(3);
      cache.set('a', 1);
      
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });
  });

  describe('measureExecutionTime', () => {
    it('should return result and duration', () => {
      const { result, duration } = measureExecutionTime(() => {
        return 'test';
      });
      
      expect(result).toBe('test');
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should measure expensive operations', () => {
      const { result, duration } = measureExecutionTime(() => {
        let sum = 0;
        for (let i = 0; i < 10000; i++) {
          sum += i;
        }
        return sum;
      });
      
      expect(result).toBe(49995000);
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('batchUpdates', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const batches: number[][] = [];
      
      await batchUpdates(items, 3, (batch) => {
        batches.push(batch);
      }, 0);
      
      expect(batches.length).toBe(4);
      expect(batches[0]).toEqual([1, 2, 3]);
      expect(batches[1]).toEqual([4, 5, 6]);
      expect(batches[2]).toEqual([7, 8, 9]);
      expect(batches[3]).toEqual([10]);
    });

    it('should handle empty array', async () => {
      const batches: number[][] = [];
      
      await batchUpdates([], 3, (batch) => {
        batches.push(batch);
      }, 0);
      
      expect(batches.length).toBe(0);
    });

    it('should handle single batch', async () => {
      const items = [1, 2];
      const batches: number[][] = [];
      
      await batchUpdates(items, 5, (batch) => {
        batches.push(batch);
      }, 0);
      
      expect(batches.length).toBe(1);
      expect(batches[0]).toEqual([1, 2]);
    });
  });
});

describe('Debounce Utils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounce concept works correctly', () => {
    let callCount = 0;
    let lastValue = '';
    
    const debounce = <T extends (...args: string[]) => void>(fn: T, delay: number) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    };
    
    const fn = (value: string) => {
      callCount++;
      lastValue = value;
    };
    
    const debouncedFn = debounce(fn, 100);
    
    debouncedFn('a');
    debouncedFn('b');
    debouncedFn('c');
    
    expect(callCount).toBe(0);
    
    jest.advanceTimersByTime(100);
    
    expect(callCount).toBe(1);
    expect(lastValue).toBe('c');
  });

  it('throttle concept works correctly', () => {
    let callCount = 0;
    
    const throttle = <T extends (...args: unknown[]) => void>(fn: T, limit: number) => {
      let lastCall = 0;
      return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= limit) {
          lastCall = now;
          fn(...args);
        }
      };
    };
    
    const fn = () => {
      callCount++;
    };
    
    const throttledFn = throttle(fn, 100);
    
    throttledFn();
    expect(callCount).toBe(1);
    
    throttledFn();
    expect(callCount).toBe(1);
    
    jest.advanceTimersByTime(100);
    
    throttledFn();
    expect(callCount).toBe(2);
  });
});
