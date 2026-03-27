import { initNativeAudio, unlockWebAudio as unlockWebAudioShared } from '@/hooks/useAudio';

class AudioMutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        if (!this.locked) {
          this.locked = true;
          resolve(() => this.release());
        } else {
          this.queue.push(tryAcquire);
        }
      };
      tryAcquire();
    });
  }

  private release(): void {
    this.locked = false;
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  isLocked(): boolean {
    return this.locked;
  }
}

export const audioMutex = new AudioMutex();

export async function withAudioLock<T>(fn: () => Promise<T>): Promise<T> {
  const release = await audioMutex.acquire();
  try {
    return await fn();
  } finally {
    release();
  }
}

export function isWebAudioUnlocked(): boolean {
  return true;
}

export async function unlockWebAudio(): Promise<boolean> {
  unlockWebAudioShared();
  return true;
}

export function getWebAudioContext(): AudioContext | null {
  return null;
}

let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

export async function initAudioOnce(initFn: () => Promise<void>): Promise<void> {
  if (isInitialized) {
    return;
  }
  
  if (initializationPromise) {
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    const release = await audioMutex.acquire();
    try {
      if (!isInitialized) {
        await initNativeAudio();
        await initFn();
        isInitialized = true;

      }
    } finally {
      release();
    }
  })();
  
  return initializationPromise;
}

export function resetAudioInitialization(): void {
  isInitialized = false;
  initializationPromise = null;
}
