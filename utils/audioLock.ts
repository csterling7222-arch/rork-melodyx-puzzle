type AsyncFunction<T> = () => Promise<T>;

class AudioMutex {
  private locked = false;
  private queue: {
    fn: AsyncFunction<unknown>;
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }[] = [];
  private lastOperationTime = 0;
  private readonly minOperationGap = 50;

  async acquire<T>(fn: AsyncFunction<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastOp = now - this.lastOperationTime;
    
    if (timeSinceLastOp < this.minOperationGap) {
      await new Promise(resolve => setTimeout(resolve, this.minOperationGap - timeSinceLastOp));
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        fn: fn as AsyncFunction<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.locked || this.queue.length === 0) return;

    this.locked = true;
    const item = this.queue.shift();

    if (!item) {
      this.locked = false;
      return;
    }

    try {
      const result = await item.fn();
      this.lastOperationTime = Date.now();
      item.resolve(result);
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.locked = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 10);
      }
    }
  }

  isLocked(): boolean {
    return this.locked;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

export const audioMutex = new AudioMutex();

export async function withAudioLock<T>(fn: AsyncFunction<T>): Promise<T> {
  return audioMutex.acquire(fn);
}

const playbackLocks = new Map<string, number>();
const PLAYBACK_DEBOUNCE_MS = 100;

export function canStartPlayback(id: string): boolean {
  const lastTime = playbackLocks.get(id) ?? 0;
  const now = Date.now();
  
  if (now - lastTime < PLAYBACK_DEBOUNCE_MS) {
    console.log(`[AudioLock] Debounced playback for ${id}`);
    return false;
  }
  
  playbackLocks.set(id, now);
  return true;
}

export function releasePlaybackLock(id: string): void {
  playbackLocks.delete(id);
}

export function clearAllPlaybackLocks(): void {
  playbackLocks.clear();
}

let webAudioUserGestureReceived = false;
let webAudioUnlockCallbacks: (() => void)[] = [];

export function markWebAudioGestureReceived(): void {
  if (webAudioUserGestureReceived) return;
  
  webAudioUserGestureReceived = true;
  console.log('[AudioLock] Web audio user gesture received');
  
  webAudioUnlockCallbacks.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.log('[AudioLock] Unlock callback error:', e);
    }
  });
  webAudioUnlockCallbacks = [];
}

export function onWebAudioUnlock(callback: () => void): void {
  if (webAudioUserGestureReceived) {
    callback();
  } else {
    webAudioUnlockCallbacks.push(callback);
  }
}

export function isWebAudioUnlocked(): boolean {
  return webAudioUserGestureReceived;
}
