import { Audio, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initNativeAudio } from '@/hooks/useAudio';

export interface AudioSnippet {
  id: string;
  melodyName: string;
  url?: string;
  localPath?: string;
  duration: number;
  isAvailable: boolean;
}

export interface AudioSnippetConfig {
  enableRealSnippets: boolean;
  fallbackToSynthesized: boolean;
  preloadCount: number;
  maxCacheSize: number;
}

const DEFAULT_CONFIG: AudioSnippetConfig = {
  enableRealSnippets: true,
  fallbackToSynthesized: true,
  preloadCount: 5,
  maxCacheSize: 50,
};

const SNIPPET_CACHE_KEY = 'melodyx_audio_snippets_cache';
const SNIPPET_CONFIG_KEY = 'melodyx_audio_snippets_config';

class AudioSnippetManager {
  private config: AudioSnippetConfig = DEFAULT_CONFIG;
  private loadedSnippets: Map<string, Audio.Sound> = new Map();
  private snippetMetadata: Map<string, AudioSnippet> = new Map();
  private isInitialized = false;
  private currentSound: Audio.Sound | null = null;

  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = (async () => {

      
      try {
        await initNativeAudio();
        
        await this.loadConfig();
        await this.loadCachedMetadata();
        
        this.isInitialized = true;

      } catch (error) {
        console.error('[AudioSnippetManager] Initialization failed:', error);
        this.initPromise = null;
        throw error;
      }
    })();
    
    return this.initPromise;
  }

  private async loadConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SNIPPET_CONFIG_KEY);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {

    }
  }

  async updateConfig(config: Partial<AudioSnippetConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    try {
      await AsyncStorage.setItem(SNIPPET_CONFIG_KEY, JSON.stringify(this.config));

    } catch (error) {

    }
  }

  private async loadCachedMetadata(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SNIPPET_CACHE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as AudioSnippet[];
        data.forEach(snippet => {
          this.snippetMetadata.set(snippet.melodyName, snippet);
        });

      }
    } catch (error) {

    }
  }

  private async saveCachedMetadata(): Promise<void> {
    try {
      const data = Array.from(this.snippetMetadata.values());
      await AsyncStorage.setItem(SNIPPET_CACHE_KEY, JSON.stringify(data.slice(-this.config.maxCacheSize)));
    } catch (error) {

    }
  }

  async registerSnippet(melodyName: string, url?: string, localPath?: string): Promise<void> {
    const snippet: AudioSnippet = {
      id: `snippet_${melodyName}_${Date.now()}`,
      melodyName,
      url,
      localPath,
      duration: 0,
      isAvailable: !!(url || localPath),
    };
    
    this.snippetMetadata.set(melodyName, snippet);
    await this.saveCachedMetadata();

  }

  async loadSnippet(melodyName: string): Promise<Audio.Sound | null> {
    if (!this.config.enableRealSnippets) {

      return null;
    }

    if (this.loadedSnippets.has(melodyName)) {

      return this.loadedSnippets.get(melodyName)!;
    }

    const metadata = this.snippetMetadata.get(melodyName);
    if (!metadata || !metadata.isAvailable) {

      return null;
    }

    try {
      const source = metadata.url 
        ? { uri: metadata.url }
        : metadata.localPath 
          ? { uri: metadata.localPath }
          : null;

      if (!source) {

        return null;
      }


      
      const { sound, status } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: false, volume: 1.0, shouldCorrectPitch: true, progressUpdateIntervalMillis: 500 },
        this.onPlaybackStatusUpdate
      );

      if (status.isLoaded && status.durationMillis) {
        metadata.duration = status.durationMillis;
        this.snippetMetadata.set(melodyName, metadata);
      }

      if (this.loadedSnippets.size >= this.config.maxCacheSize) {
        const firstKey = this.loadedSnippets.keys().next().value;
        if (firstKey) {
          const oldSound = this.loadedSnippets.get(firstKey);
          await oldSound?.unloadAsync();
          this.loadedSnippets.delete(firstKey);
        }
      }

      this.loadedSnippets.set(melodyName, sound);

      
      return sound;
    } catch (error) {
      console.error('[AudioSnippetManager] Failed to load snippet:', error);
      return null;
    }
  }

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('[AudioSnippetManager] Playback error:', status.error);
      }
    }
  };

  async playSnippet(melodyName: string, onComplete?: () => void): Promise<boolean> {
    await this.stopCurrentPlayback();

    const sound = await this.loadSnippet(melodyName);
    if (!sound) return false;

    try {
      this.currentSound = sound;
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.currentSound = null;
          onComplete?.();
        }
      });
      
      await sound.setStatusAsync({
        shouldPlay: true,
        positionMillis: 0,
      });
      return true;
    } catch (error) {
      if (__DEV__) console.error('[AudioSnippetManager] Failed to play snippet:', error);
      this.currentSound = null;
      return false;
    }
  }

  async playHintSnippet(melodyName: string, durationMs: number = 5000): Promise<boolean> {
    await this.stopCurrentPlayback();

    const sound = await this.loadSnippet(melodyName);
    if (!sound) return false;

    try {
      this.currentSound = sound;
      
      await sound.setStatusAsync({
        shouldPlay: true,
        positionMillis: 0,
      });
      
      setTimeout(async () => {
        if (this.currentSound === sound) {
          await sound.pauseAsync();
          this.currentSound = null;
        }
      }, durationMs);
      
      return true;
    } catch (error) {
      if (__DEV__) console.error('[AudioSnippetManager] Failed to play hint snippet:', error);
      this.currentSound = null;
      return false;
    }
  }

  async stopCurrentPlayback(): Promise<void> {
    if (this.currentSound) {
      try {
        this.currentSound.setOnPlaybackStatusUpdate(null);
        await this.currentSound.setStatusAsync({
          shouldPlay: false,
          positionMillis: 0,
        });
      } catch (error) {
        console.log('[AudioSnippetManager] Error stopping playback:', error);
      }
      this.currentSound = null;
    }
  }

  isPlaying(): boolean {
    return this.currentSound !== null;
  }

  hasSnippet(melodyName: string): boolean {
    const metadata = this.snippetMetadata.get(melodyName);
    return metadata?.isAvailable ?? false;
  }

  getSnippetMetadata(melodyName: string): AudioSnippet | null {
    return this.snippetMetadata.get(melodyName) ?? null;
  }

  getConfig(): AudioSnippetConfig {
    return { ...this.config };
  }

  async preloadSnippets(melodyNames: string[]): Promise<void> {
    const toLoad = melodyNames.slice(0, this.config.preloadCount);

    
    for (const name of toLoad) {
      if (!this.loadedSnippets.has(name)) {
        await this.loadSnippet(name);
      }
    }
  }

  async cleanup(): Promise<void> {

    
    await this.stopCurrentPlayback();
    
    for (const [name, sound] of this.loadedSnippets) {
      try {
        await sound.unloadAsync();
      } catch (error) {

      }
    }
    
    this.loadedSnippets.clear();

  }

  async clearCache(): Promise<void> {
    await this.cleanup();
    this.snippetMetadata.clear();
    await AsyncStorage.removeItem(SNIPPET_CACHE_KEY);

  }
}

export const audioSnippetManager = new AudioSnippetManager();

export async function initAudioSnippets(): Promise<void> {
  await audioSnippetManager.init();
}

export async function playMelodySnippet(
  melodyName: string, 
  onComplete?: () => void
): Promise<boolean> {
  return audioSnippetManager.playSnippet(melodyName, onComplete);
}

export async function playMelodyHint(
  melodyName: string, 
  durationMs?: number
): Promise<boolean> {
  return audioSnippetManager.playHintSnippet(melodyName, durationMs);
}

export function hasRealSnippet(melodyName: string): boolean {
  return audioSnippetManager.hasSnippet(melodyName);
}

export async function registerMelodySnippet(
  melodyName: string, 
  url?: string, 
  localPath?: string
): Promise<void> {
  await audioSnippetManager.registerSnippet(melodyName, url, localPath);
}

export async function stopSnippetPlayback(): Promise<void> {
  await audioSnippetManager.stopCurrentPlayback();
}

export function isSnippetPlaying(): boolean {
  return audioSnippetManager.isPlaying();
}

export async function cleanupAudioSnippets(): Promise<void> {
  await audioSnippetManager.cleanup();
}
