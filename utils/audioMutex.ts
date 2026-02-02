class AudioMutex {
  private locked = false;
  private queue: (() => void)[] = [];

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        if (!this.locked) {
          this.locked = true;
          console.log('[AudioMutex] Lock acquired');
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
    console.log('[AudioMutex] Lock released');
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

let webAudioUnlocked = false;
let webAudioContext: AudioContext | null = null;

export function isWebAudioUnlocked(): boolean {
  return webAudioUnlocked;
}

export async function unlockWebAudio(): Promise<boolean> {
  if (webAudioUnlocked) return true;
  
  try {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      webAudioContext = new AudioContext();
      
      if (webAudioContext.state === 'suspended') {
        await webAudioContext.resume();
      }
      
      const oscillator = webAudioContext.createOscillator();
      const gainNode = webAudioContext.createGain();
      gainNode.gain.value = 0;
      oscillator.connect(gainNode);
      gainNode.connect(webAudioContext.destination);
      oscillator.start(0);
      oscillator.stop(0.001);
      
      webAudioUnlocked = true;
      console.log('[AudioMutex] Web audio unlocked successfully');
      return true;
    }
  } catch (error) {
    console.log('[AudioMutex] Web audio unlock failed:', error);
  }
  return false;
}

export function getWebAudioContext(): AudioContext | null {
  return webAudioContext;
}

let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

export async function initAudioOnce(initFn: () => Promise<void>): Promise<void> {
  if (isInitialized) {
    console.log('[AudioMutex] Audio already initialized');
    return;
  }
  
  if (initializationPromise) {
    console.log('[AudioMutex] Waiting for existing initialization...');
    return initializationPromise;
  }
  
  initializationPromise = (async () => {
    const release = await audioMutex.acquire();
    try {
      if (!isInitialized) {
        await initFn();
        isInitialized = true;
        console.log('[AudioMutex] Audio initialized successfully');
      }
    } finally {
      release();
      initializationPromise = null;
    }
  })();
  
  return initializationPromise;
}

export function resetAudioInitialization(): void {
  isInitialized = false;
  initializationPromise = null;
  console.log('[AudioMutex] Audio initialization reset');
}
