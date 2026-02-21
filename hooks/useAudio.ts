import { useCallback, useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Instrument, getInstrumentById, DEFAULT_INSTRUMENT_ID } from '@/constants/instruments';
import { DEFAULT_NOTE_DURATION } from '@/utils/melodies';
import { captureError, addBreadcrumb } from '@/utils/errorTracking';
import { logAudioEvent } from '@/utils/glitchFreeEngine';

const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 261.63,
  'C#': 277.18,
  'D': 293.66,
  'D#': 311.13,
  'E': 329.63,
  'F': 349.23,
  'F#': 369.99,
  'G': 392.00,
  'G#': 415.30,
  'A': 440.00,
  'A#': 466.16,
  'B': 493.88,
};

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isLooping: boolean;
  currentNoteIndex: number;
  totalNotes: number;
  progress: number;
  mode: 'melody' | 'snippet' | 'hint' | 'teaser' | 'preview' | 'idle';
}

export interface PlaybackControls {
  pause: () => void;
  resume: () => void;
  toggleLoop: () => void;
  setSpeed: (speed: number) => void;
  replayFromStart: () => void;
}

export interface AudioSettings {
  volume: number;
  playbackSpeed: number;
  fadeIn: boolean;
  fadeOut: boolean;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  volume: 1.0,
  playbackSpeed: 1.0,
  fadeIn: false,
  fadeOut: true,
};

const BASE_TEMPO = 400;
const MIN_TEMPO = 250;

export function getProportionalTempo(noteCount: number): number {
  if (noteCount <= 6) return BASE_TEMPO;
  if (noteCount <= 10) return Math.max(MIN_TEMPO, BASE_TEMPO - (noteCount - 6) * 25);
  if (noteCount <= 20) return Math.max(MIN_TEMPO, 300 - (noteCount - 10) * 5);
  return MIN_TEMPO;
}

export function getFullPlaybackDuration(noteCount: number, tempo?: number): number {
  const effectiveTempo = tempo || getProportionalTempo(noteCount);
  return noteCount * effectiveTempo + 500;
}

export function getVariableDurationPlaybackTime(durations: number[], baseTempo: number = 400): number {
  const totalBeats = durations.reduce((sum, d) => sum + d, 0);
  return totalBeats * baseTempo + 500;
}

export function getDurationsOrDefault(notes: string[], durations?: number[]): number[] {
  if (durations && durations.length === notes.length) {
    return durations;
  }
  return notes.map(() => DEFAULT_NOTE_DURATION);
}

const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  isPlaying: false,
  isPaused: false,
  isLooping: false,
  currentNoteIndex: -1,
  totalNotes: 0,
  progress: 0,
  mode: 'idle',
};

let audioContextInstance: AudioContext | null = null;
let audioInitialized = false;
let nativeAudioInitPromise: Promise<boolean> | null = null;
let webAudioUnlocked = false;

const webSampleCache = new Map<string, Map<string, AudioBuffer>>();
const webSampleLoadingPromises = new Map<string, Promise<AudioBuffer | null>>();

const soundCache = new Map<string, Map<string, Audio.Sound>>();
const preloadQueue = new Set<string>();
let isPreloading = false;
let currentInstrumentId = DEFAULT_INSTRUMENT_ID;
const MAX_CACHE_SIZE = 60;
const PRELOAD_BATCH_SIZE = 4;
const PRELOAD_DELAY_MS = 30;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 200;

const activeSounds = new Map<string, { sound: Audio.Sound; startTime: number }>();
const SOUND_CLEANUP_INTERVAL = 2000;
let cleanupInterval: ReturnType<typeof setInterval> | null = null;
let cleanupRefCount = 0;

const NOTE_DEBOUNCE_MS = 30;
const lastPlayedNote = new Map<string, number>();
const activeSoundLocks = new Set<string>();

let lastSequenceSound: Audio.Sound | null = null;
let lastSequenceWebSource: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

const offlineCache = new Map<string, boolean>();
let isOfflineMode = false;
const AUDIO_CACHE_KEY = 'melodyx_audio_cache_status';

export function setOfflineMode(offline: boolean) {
  isOfflineMode = offline;
  addBreadcrumb({ category: 'audio', message: `Offline mode: ${offline}`, level: 'info' });
  logAudioEvent('offline_mode_changed', { offline });
}

function startSoundCleanup() {
  cleanupRefCount++;
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const toRemove: string[] = [];
    
    activeSounds.forEach((data, key) => {
      if (now - data.startTime > 3000) {
        toRemove.push(key);
      }
    });
    
    toRemove.forEach(key => {
      activeSounds.delete(key);
    });
  }, SOUND_CLEANUP_INTERVAL);
}

export function stopSoundCleanup() {
  cleanupRefCount = Math.max(0, cleanupRefCount - 1);
  if (cleanupRefCount === 0 && cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

export async function loadCacheStatus(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(AUDIO_CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      parsed.forEach(key => offlineCache.set(key, true));
      console.log('[Audio] Loaded cache status:', parsed.length, 'items');
    }
  } catch (error) {
    console.log('[Audio] Failed to load cache status:', error);
  }
}

async function saveCacheStatus(): Promise<void> {
  try {
    const keys = Array.from(offlineCache.entries())
      .filter(([, cached]) => cached)
      .map(([key]) => key);
    await AsyncStorage.setItem(AUDIO_CACHE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.log('[Audio] Failed to save cache status:', error);
  }
}

export function getAudioCacheStatus(): { cached: number; total: number; instruments: string[] } {
  let cached = 0;
  const instruments: string[] = [];
  soundCache.forEach((cache, instId) => {
    cached += cache.size;
    if (cache.size > 0) instruments.push(instId);
  });
  return { cached, total: Object.keys(NOTE_FREQUENCIES).length, instruments };
}

function getWebAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  
  try {
    if (!audioContextInstance) {
      const win = window as typeof window & { webkitAudioContext?: typeof AudioContext };
      const AudioContextClass = win.AudioContext || win.webkitAudioContext;
      if (AudioContextClass) {
        audioContextInstance = new AudioContextClass();
        console.log('[Audio] Web AudioContext created successfully');
      }
    }
    
    if (audioContextInstance && audioContextInstance.state === 'suspended') {
      audioContextInstance.resume().then(() => {
        console.log('[Audio] Web AudioContext resumed');
        webAudioUnlocked = true;
      }).catch(e => console.log('[Audio] Resume error:', e));
    } else if (audioContextInstance) {
      webAudioUnlocked = true;
    }
    
    return audioContextInstance;
  } catch (error) {
    console.log('[Audio] Failed to create Web AudioContext:', error);
    return null;
  }
}

function getWebSampleCache(instrumentId: string): Map<string, AudioBuffer> {
  if (!webSampleCache.has(instrumentId)) {
    webSampleCache.set(instrumentId, new Map());
  }
  return webSampleCache.get(instrumentId)!;
}

async function loadWebSample(note: string, instrumentId: string): Promise<AudioBuffer | null> {
  const ctx = getWebAudioContext();
  if (!ctx) return null;
  
  const cache = getWebSampleCache(instrumentId);
  if (cache.has(note)) {
    return cache.get(note) || null;
  }
  
  const cacheKey = `${instrumentId}_${note}_web`;
  if (webSampleLoadingPromises.has(cacheKey)) {
    return webSampleLoadingPromises.get(cacheKey) || null;
  }
  
  const loadPromise = (async (): Promise<AudioBuffer | null> => {
    try {
      const instrument = getInstrumentById(instrumentId);
      const fileName = NOTE_TO_FILE[note] || 'C4';
      const url = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${instrument.soundfontName}-mp3/${fileName}.mp3`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      cache.set(note, audioBuffer);

      return audioBuffer;
    } catch (error) {
      if (__DEV__) console.log(`[Audio] Web: Failed to load sample for ${note}:`, error);
      return null;
    } finally {
      webSampleLoadingPromises.delete(cacheKey);
    }
  })();
  
  webSampleLoadingPromises.set(cacheKey, loadPromise);
  return loadPromise;
}

async function preloadWebSamples(instrumentId: string): Promise<void> {
  const notes = Object.keys(NOTE_FREQUENCIES);

  
  const batchSize = 3;
  for (let i = 0; i < notes.length; i += batchSize) {
    const batch = notes.slice(i, i + batchSize);
    await Promise.all(batch.map(note => loadWebSample(note, instrumentId)));
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  

}

export function unlockWebAudio(): void {
  if (Platform.OS !== 'web' || webAudioUnlocked) return;
  
  const ctx = getWebAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      console.log('[Audio] Web audio unlocked via user interaction');
      webAudioUnlocked = true;
    }).catch(e => console.log('[Audio] Unlock error:', e));
  }
}

export async function initNativeAudio(): Promise<boolean> {
  if (audioInitialized || Platform.OS === 'web') return true;
  
  if (nativeAudioInitPromise) {
    return nativeAudioInitPromise;
  }
  
  nativeAudioInitPromise = (async () => {
    try {
      console.log('[Audio] Initializing native audio...');
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
      });
      audioInitialized = true;
      console.log('[Audio] Native audio initialized successfully');
      addBreadcrumb({ category: 'audio', message: 'Native audio initialized', level: 'info' });
      logAudioEvent('native_audio_initialized', { platform: Platform.OS });
      
      await loadCacheStatus();
      startSoundCleanup();
      
      return true;
    } catch (error) {
      console.log('[Audio] Failed to initialize native audio:', error);
      captureError(error, { tags: { component: 'Audio', action: 'initNativeAudio' } });
      logAudioEvent('native_audio_init_failed', { error: String(error) });
      return false;
    }
  })();
  
  return nativeAudioInitPromise;
}

export function isAudioInitialized(): boolean {
  return audioInitialized;
}

const NOTE_TO_FILE: Record<string, string> = {
  'C': 'C4', 'C#': 'Db4', 'D': 'D4', 'D#': 'Eb4',
  'E': 'E4', 'F': 'F4', 'F#': 'Gb4', 'G': 'G4',
  'G#': 'Ab4', 'A': 'A4', 'A#': 'Bb4', 'B': 'B4',
};

function getInstrumentCache(instrumentId: string): Map<string, Audio.Sound> {
  if (!soundCache.has(instrumentId)) {
    soundCache.set(instrumentId, new Map());
  }
  return soundCache.get(instrumentId)!;
}

async function preloadSound(note: string, instrumentId: string = currentInstrumentId, retryCount: number = 0): Promise<Audio.Sound | null> {
  if (Platform.OS === 'web') return null;
  
  const cache = getInstrumentCache(instrumentId);
  if (cache.has(note)) {
    offlineCache.set(`${instrumentId}_${note}`, true);
    return cache.get(note) || null;
  }
  
  const cacheKey = `${instrumentId}_${note}`;
  if (preloadQueue.has(cacheKey)) return null;
  
  if (isOfflineMode && !offlineCache.get(cacheKey)) {
    console.log(`[Audio] Offline mode - skipping network request for ${note}`);
    return null;
  }
  
  preloadQueue.add(cacheKey);
  
  try {
    const instrument = getInstrumentById(instrumentId);
    const fileName = NOTE_TO_FILE[note] || 'C4';
    const url = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${instrument.soundfontName}-mp3/${fileName}.mp3`;
    
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: false, volume: 1.0, progressUpdateIntervalMillis: 500, shouldCorrectPitch: true },
      null,
      true
    );
    
    cache.set(note, sound);
    offlineCache.set(cacheKey, true);
    saveCacheStatus();
    addBreadcrumb({ category: 'audio', message: `Preloaded ${note}`, level: 'debug' });
    return sound;
  } catch (error) {
    if (__DEV__ && retryCount >= MAX_RETRY_ATTEMPTS) console.log(`[Audio] Failed to preload ${instrumentId} ${note} after ${retryCount + 1} attempts`);
    
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      preloadQueue.delete(cacheKey);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
      return preloadSound(note, instrumentId, retryCount + 1);
    }
    
    captureError(error, { tags: { component: 'Audio', action: 'preloadSound', note, retries: String(retryCount) } });
    offlineCache.set(cacheKey, false);
    return null;
  } finally {
    preloadQueue.delete(cacheKey);
  }
}

async function preloadAllSounds(instrumentId: string = currentInstrumentId) {
  if (Platform.OS === 'web' || isPreloading) return;
  isPreloading = true;
  
  const notes = Object.keys(NOTE_FREQUENCIES);
  const cache = getInstrumentCache(instrumentId);
  if (__DEV__) console.log(`[Audio] Starting preload for ${instrumentId}...`);
  
  const notesToLoad = notes.filter(note => !cache.has(note));
  
  for (let i = 0; i < notesToLoad.length; i += PRELOAD_BATCH_SIZE) {
    const batch = notesToLoad.slice(i, i + PRELOAD_BATCH_SIZE);
    await Promise.all(batch.map(note => preloadSound(note, instrumentId)));
    await new Promise(resolve => setTimeout(resolve, PRELOAD_DELAY_MS));
  }
  
  cleanupOldCaches(instrumentId);
  if (__DEV__) console.log(`[Audio] Preload complete for ${instrumentId} (${cache.size} sounds cached)`);
  isPreloading = false;
}

async function cleanupOldCaches(activeInstrumentId: string) {
  let totalCached = 0;
  soundCache.forEach((cache) => {
    totalCached += cache.size;
  });
  
  if (totalCached > MAX_CACHE_SIZE) {
    const cleanupPromises: Promise<void>[] = [];
    
    soundCache.forEach((cache, instId) => {
      if (instId !== activeInstrumentId && cache.size > 0) {
        if (__DEV__) console.log(`[Audio] Cleaning up cache for ${instId}`);
        const sounds = Array.from(cache.values());
        cache.clear();
        
        for (const sound of sounds) {
          cleanupPromises.push(
            sound.unloadAsync().then(() => {}).catch(e => {
              console.log('[Audio] Error unloading sound:', e);
            })
          );
        }
      }
    });
    
    await Promise.all(cleanupPromises);
  }
}

export function useAudio(instrumentId?: string, settings?: Partial<AudioSettings>) {
  const playbackTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const noteStopTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isLoadingRef = useRef<Set<string>>(new Set());
  const currentInstrumentRef = useRef<Instrument>(getInstrumentById(instrumentId || DEFAULT_INSTRUMENT_ID));
  const audioSettingsRef = useRef<AudioSettings>({ ...DEFAULT_AUDIO_SETTINGS, ...settings });
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>(DEFAULT_PLAYBACK_STATE);
  const [isLooping, setIsLooping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const lastPlayedNotesRef = useRef<string[]>([]);
  const lastPlayedTempoRef = useRef<number>(400);
  const pausedAtIndexRef = useRef<number>(-1);

  const [volume, setVolume] = useState(settings?.volume ?? 1.0);
  const [playbackSpeed, setPlaybackSpeed] = useState(settings?.playbackSpeed ?? 1.0);

  useEffect(() => {
    audioSettingsRef.current = { ...audioSettingsRef.current, volume, playbackSpeed };
  }, [volume, playbackSpeed]);

  useEffect(() => {
    const instId = instrumentId || DEFAULT_INSTRUMENT_ID;
    currentInstrumentRef.current = getInstrumentById(instId);
    currentInstrumentId = instId;
    
    if (Platform.OS !== 'web') {
      initNativeAudio().then(() => {
        preloadAllSounds(instId);
      });
    } else {
      preloadWebSamples(instId);
    }
  }, [instrumentId]);

  useEffect(() => {
    return () => {
      playbackTimeoutsRef.current.forEach(clearTimeout);
      playbackTimeoutsRef.current = [];
      noteStopTimeouts.current.forEach(clearTimeout);
      noteStopTimeouts.current.clear();
      stopSoundCleanup();
    };
  }, []);

  const playNoteWeb = useCallback(async (note: string, duration: number = 0.35, isSequence: boolean = false) => {
    try {
      const ctx = getWebAudioContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        await ctx.resume();
        webAudioUnlocked = true;
      }

      const frequency = NOTE_FREQUENCIES[note];
      if (!frequency) return;

      const now = Date.now();
      if (!isSequence) {
        const debounceKey = `web_${note}`;
        const lastPlayed = lastPlayedNote.get(debounceKey) ?? 0;
        if (now - lastPlayed < NOTE_DEBOUNCE_MS) return;
        lastPlayedNote.set(debounceKey, now);
      }

      if (isSequence && lastSequenceWebSource) {
        try {
          lastSequenceWebSource.gain.gain.cancelScheduledValues(ctx.currentTime);
          lastSequenceWebSource.gain.gain.setValueAtTime(
            lastSequenceWebSource.gain.gain.value, ctx.currentTime
          );
          lastSequenceWebSource.gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
          const oldSource = lastSequenceWebSource.source;
          setTimeout(() => { try { oldSource.stop(); } catch (_e) {} }, 50);
        } catch (_e) {}
        lastSequenceWebSource = null;
      }

      const instrument = currentInstrumentRef.current;
      const { volume: vol } = audioSettingsRef.current;
      const noteDur = isSequence ? Math.min(duration, 0.38) : duration;
      
      const cache = getWebSampleCache(instrument.id);
      let audioBuffer = cache.get(note);
      
      if (!audioBuffer) {
        audioBuffer = await loadWebSample(note, instrument.id) || undefined;
      }
      
      if (audioBuffer) {
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        const maxPlayDuration = isSequence ? Math.min(noteDur + 0.05, 0.4) : Math.max(0.3, Math.min(instrument.attackTime + instrument.decayTime + instrument.releaseTime, 0.8));
        const fadeOutStart = maxPlayDuration * 0.65;
        
        gainNode.gain.setValueAtTime(vol, ctx.currentTime);
        gainNode.gain.setValueAtTime(vol, ctx.currentTime + fadeOutStart);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + maxPlayDuration);
        
        source.start(0);
        source.stop(ctx.currentTime + maxPlayDuration + 0.05);

        if (isSequence) {
          lastSequenceWebSource = { source, gain: gainNode };
        }
      } else {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filterNode = ctx.createBiquadFilter();

        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(instrument.id === 'synth' ? 6000 : 4000, ctx.currentTime);
        filterNode.Q.setValueAtTime(0.7, ctx.currentTime);

        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = instrument.waveType;
        
        let adjustedFreq = frequency;
        if (instrument.id === 'bass') {
          adjustedFreq = frequency / 2;
        }
        oscillator.frequency.setValueAtTime(adjustedFreq, ctx.currentTime);

        const { attackTime, sustainLevel, releaseTime } = instrument;
        const effectiveRelease = isSequence ? Math.min(releaseTime, 0.1) : releaseTime;
        const maxGain = 0.4 * vol;
        const sustainGain = Math.max(0.01, sustainLevel * 0.4 * vol);
        
        gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(maxGain, ctx.currentTime + Math.max(0.005, attackTime));
        gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, sustainGain), ctx.currentTime + noteDur * 0.6);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noteDur + effectiveRelease);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + noteDur + effectiveRelease + 0.05);
      }
    } catch (_error) {
      // Silent - avoid console spam
    }
  }, []);

  const playNoteNative = useCallback(async (note: string, isSequence: boolean = false) => {
    if (Platform.OS === 'web') return;
    
    try {
      if (!audioInitialized) {
        await initNativeAudio();
      }

      const frequency = NOTE_FREQUENCIES[note];
      if (!frequency) return;

      const instrument = currentInstrumentRef.current;
      const instId = instrument.id;
      const lockKey = `${instId}_${note}`;
      
      const now = Date.now();
      if (!isSequence) {
        const lastPlayed = lastPlayedNote.get(lockKey) ?? 0;
        if (now - lastPlayed < NOTE_DEBOUNCE_MS) return;
      }
      lastPlayedNote.set(lockKey, now);

      if (activeSoundLocks.has(lockKey) && !isSequence) return;
      activeSoundLocks.add(lockKey);

      const noteDurationMs = Math.round(
        (instrument.attackTime + instrument.decayTime + instrument.releaseTime) * 1000
      );
      const maxDurationMs = isSequence
        ? Math.max(200, Math.min(noteDurationMs, 350))
        : Math.max(300, Math.min(noteDurationMs, 800));

      try {
        if (isSequence && lastSequenceSound) {
          try {
            const prevStatus = await lastSequenceSound.getStatusAsync();
            if (prevStatus.isLoaded && prevStatus.isPlaying) {
              const startVol = audioSettingsRef.current.volume;
              await lastSequenceSound.setVolumeAsync(startVol * 0.15);
              const fadeSound = lastSequenceSound;
              setTimeout(async () => {
                try {
                  await fadeSound.stopAsync();
                  await fadeSound.setVolumeAsync(startVol);
                } catch (_e) {}
              }, 40);
            }
          } catch (_e) {}
          lastSequenceSound = null;
        }

        const cache = getInstrumentCache(instId);
        let sound = cache.get(note);
        
        const loadKey = `${instId}_${note}`;
        if (!sound && !isLoadingRef.current.has(loadKey)) {
          isLoadingRef.current.add(loadKey);
          sound = await preloadSound(note, instId) || undefined;
          isLoadingRef.current.delete(loadKey);
        }

        if (sound) {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded && status.isPlaying) {
              await sound.stopAsync();
            }
            await sound.setStatusAsync({
              shouldPlay: true,
              positionMillis: 0,
              volume: audioSettingsRef.current.volume,
            });

            if (isSequence) {
              lastSequenceSound = sound;
            }

            const fadeKey = `fade_${lockKey}_${now}`;
            noteStopTimeouts.current.set(fadeKey, setTimeout(async () => {
              try {
                const currentStatus = await sound!.getStatusAsync();
                if (currentStatus.isLoaded && currentStatus.isPlaying) {
                  const fadeSteps = isSequence ? 3 : 5;
                  const fadeInterval = isSequence ? 25 : 40;
                  const startVol = audioSettingsRef.current.volume;
                  for (let i = 1; i <= fadeSteps; i++) {
                    const fadeTimeout = setTimeout(async () => {
                      try {
                        const vol = startVol * (1 - i / fadeSteps);
                        await sound!.setVolumeAsync(Math.max(0, vol));
                        if (i === fadeSteps) {
                          await sound!.stopAsync();
                          await sound!.setVolumeAsync(startVol);
                        }
                      } catch (_e) {}
                    }, i * fadeInterval);
                    noteStopTimeouts.current.set(`${fadeKey}_${i}`, fadeTimeout);
                  }
                }
              } catch (_e) {}
              noteStopTimeouts.current.delete(fadeKey);
            }, maxDurationMs));
          } catch (playError) {
            cache.delete(note);
            try {
              const newSound = await preloadSound(note, instId);
              if (newSound) {
                await newSound.setStatusAsync({
                  shouldPlay: true,
                  positionMillis: 0,
                  volume: audioSettingsRef.current.volume,
                });
                setTimeout(async () => {
                  try {
                    await newSound.stopAsync();
                  } catch (_e) {}
                }, maxDurationMs + 100);
              }
            } catch (_retryError) {
              // Silent retry failure
            }
          }
        }
      } finally {
        activeSoundLocks.delete(lockKey);
      }
    } catch (_error) {
      // Silent error - avoid console spam on native
    }
  }, []);

  const playNote = useCallback((note: string) => {
    try {
      if (Platform.OS === 'web') {
        playNoteWeb(note);
      } else {
        playNoteNative(note);
      }
    } catch (_error) {
      // Silent - avoid console spam
    }
  }, [playNoteWeb, playNoteNative]);

  const playSequenceNote = useCallback((note: string, duration: number = 0.35) => {
    try {
      if (Platform.OS === 'web') {
        playNoteWeb(note, duration, true);
      } else {
        playNoteNative(note, true);
      }
    } catch (_error) {
      // Silent - avoid console spam
    }
  }, [playNoteWeb, playNoteNative]);

  const stopPlayback = useCallback(() => {
    playbackTimeoutsRef.current.forEach(clearTimeout);
    playbackTimeoutsRef.current = [];
    noteStopTimeouts.current.forEach(clearTimeout);
    noteStopTimeouts.current.clear();
    lastPlayedNote.clear();
    lastSequenceSound = null;
    lastSequenceWebSource = null;
    setIsPaused(false);
    pausedAtIndexRef.current = -1;
    setPlaybackState(DEFAULT_PLAYBACK_STATE);
  }, []);

  const pausePlayback = useCallback(() => {
    if (!playbackState.isPlaying || playbackState.isPaused) return;
    
    playbackTimeoutsRef.current.forEach(clearTimeout);
    playbackTimeoutsRef.current = [];
    pausedAtIndexRef.current = playbackState.currentNoteIndex;
    setIsPaused(true);
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
    }));

  }, [playbackState.isPlaying, playbackState.isPaused, playbackState.currentNoteIndex]);

  const resumePlayback = useCallback(() => {
    if (!playbackState.isPaused || pausedAtIndexRef.current < 0) return;
    
    const notes = lastPlayedNotesRef.current;
    const tempo = lastPlayedTempoRef.current / audioSettingsRef.current.playbackSpeed;
    const startIndex = pausedAtIndexRef.current + 1;
    
    if (startIndex >= notes.length) {
      stopPlayback();
      return;
    }
    
    setIsPaused(false);
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
    }));
    
    lastSequenceSound = null;
    lastSequenceWebSource = null;
    const remainingNotes = notes.slice(startIndex);
    remainingNotes.forEach((note, index) => {
      const timeout = setTimeout(() => {
        playSequenceNote(note, tempo / 1000);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: startIndex + index,
          progress: (startIndex + index + 1) / notes.length,
        }));
      }, index * tempo);
      playbackTimeoutsRef.current.push(timeout);
    });
    
    const endTimeout = setTimeout(() => {
      lastSequenceSound = null;
      lastSequenceWebSource = null;
      setPlaybackState(DEFAULT_PLAYBACK_STATE);
    }, remainingNotes.length * tempo + 300);
    playbackTimeoutsRef.current.push(endTimeout);
    

  }, [playbackState.isPaused, stopPlayback, playSequenceNote]);

  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev);
  }, []);

  const replayFromStartRef = useRef<() => void>(() => {});

  const playMelodyInternal = useCallback((notes: string[], tempo: number = 400, mode: PlaybackState['mode'] = 'melody', durations?: number[]) => {
    stopPlayback();
    
    lastPlayedNote.clear();
    lastSequenceSound = null;
    lastSequenceWebSource = null;
    
    lastPlayedNotesRef.current = notes;
    lastPlayedTempoRef.current = tempo;
    const adjustedTempo = tempo / audioSettingsRef.current.playbackSpeed;
    const noteDurations = getDurationsOrDefault(notes, durations);
    
    setPlaybackState({
      isPlaying: true,
      isPaused: false,
      isLooping,
      currentNoteIndex: 0,
      totalNotes: notes.length,
      progress: 0,
      mode,
    });

    let cumulativeTime = 0;
    notes.forEach((note, index) => {
      const timeout = setTimeout(() => {
        const durationBeat = noteDurations[index] || 0.5;
        playSequenceNote(note, durationBeat * adjustedTempo / 1000);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: index,
          progress: (index + 1) / notes.length,
        }));
      }, cumulativeTime);
      playbackTimeoutsRef.current.push(timeout);
      const durationBeat = noteDurations[index] || 0.5;
      cumulativeTime += durationBeat * adjustedTempo;
    });

    const endTimeout = setTimeout(() => {
      lastSequenceSound = null;
      lastSequenceWebSource = null;
      if (isLooping) {
        replayFromStartRef.current();
      } else {
        setPlaybackState(DEFAULT_PLAYBACK_STATE);
      }
    }, cumulativeTime + 400);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [isLooping, stopPlayback, playSequenceNote]);

  const replayFromStart = useCallback(() => {
    const notes = lastPlayedNotesRef.current;
    const tempo = lastPlayedTempoRef.current;
    const mode = playbackState.mode !== 'idle' ? playbackState.mode : 'melody';
    
    if (notes.length > 0) {
      stopPlayback();
      setTimeout(() => {
        playMelodyInternal(notes, tempo, mode);
      }, 100);

    }
  }, [playbackState.mode, stopPlayback, playMelodyInternal]);

  useEffect(() => {
    replayFromStartRef.current = replayFromStart;
  }, [replayFromStart]);

  const playMelody = useCallback((notes: string[], tempo?: number, durations?: number[]) => {
    const effectiveTempo = tempo || getProportionalTempo(notes.length);
    playMelodyInternal(notes, effectiveTempo, 'melody', durations);
  }, [playMelodyInternal]);

  const playMelodyWithDurations = useCallback((notes: string[], durations: number[], baseTempo: number = 400) => {

    playMelodyInternal(notes, baseTempo, 'melody', durations);
  }, [playMelodyInternal]);

  const playFullMelody = useCallback((notes: string[], onComplete?: () => void, durations?: number[]) => {
    stopPlayback();
    const tempo = getProportionalTempo(notes.length);
    lastPlayedNotesRef.current = notes;
    lastPlayedTempoRef.current = tempo;
    const noteDurations = getDurationsOrDefault(notes, durations);
    
    lastSequenceSound = null;
    lastSequenceWebSource = null;
    
    setPlaybackState({
      isPlaying: true,
      isPaused: false,
      isLooping,
      currentNoteIndex: 0,
      totalNotes: notes.length,
      progress: 0,
      mode: 'melody',
    });

    const adjustedTempo = tempo / audioSettingsRef.current.playbackSpeed;
    let cumulativeTime = 0;
    
    notes.forEach((note, index) => {
      const timeout = setTimeout(() => {
        const durationBeat = noteDurations[index] || 0.5;
        playSequenceNote(note, durationBeat * adjustedTempo / 1000);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: index,
          progress: (index + 1) / notes.length,
        }));
      }, cumulativeTime);
      playbackTimeoutsRef.current.push(timeout);
      const durationBeat = noteDurations[index] || 0.5;
      cumulativeTime += durationBeat * adjustedTempo;
    });

    const endTimeout = setTimeout(() => {
      lastSequenceSound = null;
      lastSequenceWebSource = null;
      if (isLooping) {
        playFullMelody(notes, onComplete, durations);
      } else {
        setPlaybackState(DEFAULT_PLAYBACK_STATE);
        onComplete?.();
      }
    }, cumulativeTime + 400);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [playSequenceNote, stopPlayback, isLooping]);

  const playSnippet = useCallback((notes: string[], onComplete?: () => void, durations?: number[]) => {
    stopPlayback();
    lastPlayedNotesRef.current = notes;
    const noteDurations = getDurationsOrDefault(notes, durations);

    const snippetTempo = Math.max(350, 500 - notes.length * 8);
    lastPlayedTempoRef.current = snippetTempo;
    
    lastSequenceSound = null;
    lastSequenceWebSource = null;
    
    setPlaybackState({
      isPlaying: true,
      isPaused: false,
      isLooping,
      currentNoteIndex: 0,
      totalNotes: notes.length,
      progress: 0,
      mode: 'snippet',
    });

    const adjustedTempo = snippetTempo / audioSettingsRef.current.playbackSpeed;
    let cumulativeTime = 0;
    
    notes.forEach((note, index) => {
      const noteDelay = cumulativeTime;
      const timeout = setTimeout(() => {
        const durationBeat = noteDurations[index] || 0.5;
        playSequenceNote(note, durationBeat * adjustedTempo / 1000);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: index,
          progress: (index + 1) / notes.length,
        }));
      }, noteDelay);
      playbackTimeoutsRef.current.push(timeout);
      const durationBeat = noteDurations[index] || 0.5;
      cumulativeTime += durationBeat * adjustedTempo;
    });

    const endTimeout = setTimeout(() => {
      lastSequenceSound = null;
      lastSequenceWebSource = null;
      if (isLooping) {
        playSnippet(notes, onComplete, durations);
      } else {
        setPlaybackState(DEFAULT_PLAYBACK_STATE);
        onComplete?.();
      }
    }, cumulativeTime + 400);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [playSequenceNote, stopPlayback, isLooping]);

  const playHintNotes = useCallback((notes: string[], count: number = 3) => {
    const hintNotes = notes.slice(0, Math.min(count, notes.length));
    
    stopPlayback();
    lastPlayedNotesRef.current = hintNotes;
    lastPlayedTempoRef.current = 500;
    lastSequenceSound = null;
    lastSequenceWebSource = null;
    
    setPlaybackState({
      isPlaying: true,
      isPaused: false,
      isLooping: false,
      currentNoteIndex: 0,
      totalNotes: hintNotes.length,
      progress: 0,
      mode: 'hint',
    });

    const tempo = 500 / audioSettingsRef.current.playbackSpeed;
    
    hintNotes.forEach((note, index) => {
      const timeout = setTimeout(() => {
        playSequenceNote(note, tempo / 1000);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: index,
          progress: (index + 1) / hintNotes.length,
        }));
      }, index * tempo);
      playbackTimeoutsRef.current.push(timeout);
    });

    const endTimeout = setTimeout(() => {
      lastSequenceSound = null;
      lastSequenceWebSource = null;
      setPlaybackState(DEFAULT_PLAYBACK_STATE);
    }, hintNotes.length * tempo + 300);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [playSequenceNote, stopPlayback]);

  const playTeaser = useCallback((notes: string[], duration: number = 5) => {
    const teaserCount = Math.min(Math.ceil(notes.length * 0.4), Math.floor(duration / 0.5));
    const teaserNotes = notes.slice(0, Math.max(3, teaserCount));
    
    stopPlayback();
    lastPlayedNotesRef.current = teaserNotes;
    lastPlayedTempoRef.current = 450;
    lastSequenceSound = null;
    lastSequenceWebSource = null;
    
    setPlaybackState({
      isPlaying: true,
      isPaused: false,
      isLooping: false,
      currentNoteIndex: 0,
      totalNotes: teaserNotes.length,
      progress: 0,
      mode: 'teaser',
    });

    const tempo = 450 / audioSettingsRef.current.playbackSpeed;
    
    teaserNotes.forEach((note, index) => {
      const timeout = setTimeout(() => {
        playSequenceNote(note, tempo / 1000);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: index,
          progress: (index + 1) / teaserNotes.length,
        }));
      }, index * tempo);
      playbackTimeoutsRef.current.push(timeout);
    });

    const endTimeout = setTimeout(() => {
      lastSequenceSound = null;
      lastSequenceWebSource = null;
      setPlaybackState(DEFAULT_PLAYBACK_STATE);
    }, teaserNotes.length * tempo + 300);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [playSequenceNote, stopPlayback]);

  const playNotePreview = useCallback((note: string) => {

    playNote(note);
    
    setPlaybackState(prev => ({
      ...prev,
      mode: 'preview',
    }));
    
    setTimeout(() => {
      setPlaybackState(prev => {
        if (prev.mode === 'preview') {
          return { ...prev, mode: 'idle' };
        }
        return prev;
      });
    }, 300);
  }, [playNote]);

  const preloadNotes = useCallback(async (notes: string[]) => {
    if (Platform.OS === 'web') return;
    const instId = currentInstrumentRef.current.id;

    await Promise.all(notes.map(note => preloadSound(note, instId)));
  }, []);

  const isNoteCached = useCallback((note: string): boolean => {
    const instId = currentInstrumentRef.current.id;
    const cache = getInstrumentCache(instId);
    return cache.has(note);
  }, []);

  const initAudio = useCallback(() => {
    if (Platform.OS === 'web') {
      unlockWebAudio();
    } else {
      initNativeAudio();
    }
  }, []);

  const updateVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);

  }, []);

  const updatePlaybackSpeed = useCallback((speed: number) => {
    const clampedSpeed = Math.max(0.5, Math.min(2, speed));
    setPlaybackSpeed(clampedSpeed);

  }, []);

  const fadeToVolume = useCallback((targetVolume: number, durationMs: number = 500) => {
    const startVolume = volume;
    const steps = 20;
    const stepDuration = durationMs / steps;
    const volumeStep = (targetVolume - startVolume) / steps;
    
    for (let i = 1; i <= steps; i++) {
      const timeout = setTimeout(() => {
        const newVol = startVolume + (volumeStep * i);
        setVolume(Math.max(0, Math.min(1, newVol)));
      }, stepDuration * i);
      playbackTimeoutsRef.current.push(timeout);
    }
  }, [volume]);

  const playbackControls: PlaybackControls = {
    pause: pausePlayback,
    resume: resumePlayback,
    toggleLoop,
    setSpeed: updatePlaybackSpeed,
    replayFromStart,
  };

  return { 
    playNote, 
    playNotePreview,
    playMelody,
    playMelodyWithDurations,
    playFullMelody,
    playSnippet,
    playHintNotes,
    playTeaser,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    toggleLoop,
    replayFromStart,
    playbackState: {
      ...playbackState,
      isLooping,
      isPaused,
    },
    playbackControls,
    preloadNotes,
    isNoteCached,
    initAudio,
    volume,
    playbackSpeed,
    updateVolume,
    updatePlaybackSpeed,
    fadeToVolume,
    getProportionalTempo,
    getVariableDurationPlaybackTime,
  };
}
