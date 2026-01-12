import { useCallback, useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Instrument, getInstrumentById, DEFAULT_INSTRUMENT_ID } from '@/constants/instruments';
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
let webAudioUnlocked = false;

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

const offlineCache = new Map<string, boolean>();
let isOfflineMode = false;
const AUDIO_CACHE_KEY = 'melodyx_audio_cache_status';

export function setOfflineMode(offline: boolean) {
  isOfflineMode = offline;
  console.log('[Audio] Offline mode:', offline);
  addBreadcrumb({ category: 'audio', message: `Offline mode: ${offline}`, level: 'info' });
  logAudioEvent('offline_mode_changed', { offline });
}

function startSoundCleanup() {
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
    
    if (toRemove.length > 0) {
      console.log('[Audio] Cleaned up', toRemove.length, 'finished sounds');
    }
  }, SOUND_CLEANUP_INTERVAL);
}

export function stopSoundCleanup() {
  if (cleanupInterval) {
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

async function initNativeAudio() {
  if (audioInitialized || Platform.OS === 'web') return true;
  
  try {
    console.log('[Audio] Initializing native audio...');
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
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
      { shouldPlay: false, volume: 1.0, progressUpdateIntervalMillis: 100 },
      null,
      true
    );
    
    cache.set(note, sound);
    offlineCache.set(cacheKey, true);
    saveCacheStatus();
    console.log(`[Audio] Preloaded ${instrumentId} sound for ${note}`);
    addBreadcrumb({ category: 'audio', message: `Preloaded ${note}`, level: 'debug' });
    return sound;
  } catch (error) {
    console.log(`[Audio] Failed to preload ${instrumentId} ${note} (attempt ${retryCount + 1}):`, error);
    
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
  console.log(`[Audio] Starting preload for ${instrumentId}...`);
  
  const notesToLoad = notes.filter(note => !cache.has(note));
  
  for (let i = 0; i < notesToLoad.length; i += PRELOAD_BATCH_SIZE) {
    const batch = notesToLoad.slice(i, i + PRELOAD_BATCH_SIZE);
    await Promise.all(batch.map(note => preloadSound(note, instrumentId)));
    await new Promise(resolve => setTimeout(resolve, PRELOAD_DELAY_MS));
  }
  
  cleanupOldCaches(instrumentId);
  console.log(`[Audio] Preload complete for ${instrumentId} (${cache.size} sounds cached)`);
  isPreloading = false;
}

function cleanupOldCaches(currentInstrumentId: string) {
  let totalCached = 0;
  soundCache.forEach((cache) => {
    totalCached += cache.size;
  });
  
  if (totalCached > MAX_CACHE_SIZE) {
    soundCache.forEach((cache, instId) => {
      if (instId !== currentInstrumentId && cache.size > 0) {
        console.log(`[Audio] Cleaning up cache for ${instId}`);
        cache.forEach(async (sound) => {
          try {
            await sound.unloadAsync();
          } catch (e) {
            console.log('[Audio] Error unloading sound:', e);
          }
        });
        cache.clear();
      }
    });
  }
}

export function useAudio(instrumentId?: string, settings?: Partial<AudioSettings>) {
  const playbackTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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
    }
    
    console.log(`Audio hook using instrument: ${instId}`);
  }, [instrumentId]);

  useEffect(() => {
    const timeouts = playbackTimeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const playNoteWeb = useCallback((note: string, duration: number = 0.35) => {
    try {
      const ctx = getWebAudioContext();
      if (!ctx) {
        console.log('[Audio] No web audio context available');
        return;
      }

      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          webAudioUnlocked = true;
        }).catch(e => console.log('[Audio] Resume error:', e));
      }

      const frequency = NOTE_FREQUENCIES[note];
      if (!frequency) {
        console.log('[Audio] Unknown note:', note);
        return;
      }

      const instrument = currentInstrumentRef.current;
      const { volume: vol, fadeIn, fadeOut } = audioSettingsRef.current;
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filterNode = ctx.createBiquadFilter();

      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(instrument.id === 'synth' ? 4000 : 2000, ctx.currentTime);

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
      const maxGain = 0.5 * vol;
      const sustainGain = Math.max(0.01, sustainLevel * 0.5 * vol);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      
      if (fadeIn) {
        gainNode.gain.linearRampToValueAtTime(maxGain, ctx.currentTime + attackTime + 0.1);
      } else {
        gainNode.gain.linearRampToValueAtTime(maxGain, ctx.currentTime + attackTime);
      }
      
      gainNode.gain.exponentialRampToValueAtTime(sustainGain, ctx.currentTime + duration * 0.7);
      
      if (fadeOut) {
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration + releaseTime + 0.1);
      } else {
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration + releaseTime);
      }

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration + releaseTime + 0.15);

      console.log(`[Audio] Web: Playing ${note} on ${instrument.name} (vol: ${vol})`);
    } catch (error) {
      console.log('[Audio] Web audio error:', error);
    }
  }, []);

  const playNoteNative = useCallback(async (note: string) => {
    if (Platform.OS === 'web') return;
    
    try {
      if (!audioInitialized) {
        await initNativeAudio();
      }

      const frequency = NOTE_FREQUENCIES[note];
      if (!frequency) {
        console.log('[Audio] Unknown note:', note);
        return;
      }

      const instId = currentInstrumentRef.current.id;
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
          if (status.isLoaded) {
            await sound.setPositionAsync(0);
            await sound.setVolumeAsync(audioSettingsRef.current.volume);
            await sound.playAsync();
          } else {
            console.log(`[Audio] Sound not loaded for ${note}, reloading...`);
            cache.delete(note);
            const newSound = await preloadSound(note, instId);
            if (newSound) {
              await newSound.setPositionAsync(0);
              await newSound.playAsync();
            }
          }
        } catch (playError) {
          console.log(`[Audio] Play error for ${note}:`, playError);
          cache.delete(note);
          captureError(playError, { tags: { component: 'Audio', action: 'playNote', note } });
        }
      }
    } catch (error) {
      console.log(`[Audio] Native audio error for ${note}:`, error);
      captureError(error, { tags: { component: 'Audio', action: 'playNoteNative' } });
    }
  }, []);

  const playNote = useCallback((note: string) => {
    console.log(`[Audio] playNote: ${note} on ${Platform.OS}`);
    try {
      if (Platform.OS === 'web') {
        playNoteWeb(note);
      } else {
        playNoteNative(note);
      }
    } catch (error) {
      console.log('[Audio] Error playing note:', error);
    }
  }, [playNoteWeb, playNoteNative]);

  const stopPlayback = useCallback(() => {
    playbackTimeoutsRef.current.forEach(clearTimeout);
    playbackTimeoutsRef.current = [];
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
    console.log('[Audio] Playback paused at index:', pausedAtIndexRef.current);
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
    
    const remainingNotes = notes.slice(startIndex);
    remainingNotes.forEach((note, index) => {
      const timeout = setTimeout(() => {
        playNote(note);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: startIndex + index,
          progress: (startIndex + index + 1) / notes.length,
        }));
      }, index * tempo);
      playbackTimeoutsRef.current.push(timeout);
    });
    
    const endTimeout = setTimeout(() => {
      setPlaybackState(DEFAULT_PLAYBACK_STATE);
    }, remainingNotes.length * tempo + 300);
    playbackTimeoutsRef.current.push(endTimeout);
    
    console.log('[Audio] Playback resumed from index:', startIndex);
  }, [playbackState.isPaused, stopPlayback, playNote]);

  const toggleLoop = useCallback(() => {
    setIsLooping(prev => {
      console.log('[Audio] Loop toggled:', !prev);
      return !prev;
    });
  }, []);

  const replayFromStartRef = useRef<() => void>(() => {});

  const playMelodyInternal = useCallback((notes: string[], tempo: number = 400, mode: PlaybackState['mode'] = 'melody') => {
    stopPlayback();
    lastPlayedNotesRef.current = notes;
    lastPlayedTempoRef.current = tempo;
    const adjustedTempo = tempo / audioSettingsRef.current.playbackSpeed;
    console.log(`[Audio] Playing ${mode}: ${notes.join(', ')} at speed ${audioSettingsRef.current.playbackSpeed}x`);
    
    setPlaybackState({
      isPlaying: true,
      isPaused: false,
      isLooping,
      currentNoteIndex: 0,
      totalNotes: notes.length,
      progress: 0,
      mode,
    });

    notes.forEach((note, index) => {
      const timeout = setTimeout(() => {
        playNote(note);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: index,
          progress: (index + 1) / notes.length,
        }));
      }, index * adjustedTempo);
      playbackTimeoutsRef.current.push(timeout);
    });

    const endTimeout = setTimeout(() => {
      if (isLooping) {
        replayFromStartRef.current();
      } else {
        setPlaybackState(DEFAULT_PLAYBACK_STATE);
      }
    }, notes.length * adjustedTempo + 300);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [isLooping, stopPlayback, playNote]);

  const replayFromStart = useCallback(() => {
    const notes = lastPlayedNotesRef.current;
    const tempo = lastPlayedTempoRef.current;
    const mode = playbackState.mode !== 'idle' ? playbackState.mode : 'melody';
    
    if (notes.length > 0) {
      stopPlayback();
      setTimeout(() => {
        playMelodyInternal(notes, tempo, mode);
      }, 100);
      console.log('[Audio] Replaying from start');
    }
  }, [playbackState.mode, stopPlayback, playMelodyInternal]);

  useEffect(() => {
    replayFromStartRef.current = replayFromStart;
  }, [replayFromStart]);

  const playMelody = useCallback((notes: string[], tempo?: number) => {
    const effectiveTempo = tempo || getProportionalTempo(notes.length);
    playMelodyInternal(notes, effectiveTempo, 'melody');
  }, [playMelodyInternal]);

  const playFullMelody = useCallback((notes: string[], onComplete?: () => void) => {
    stopPlayback();
    const tempo = getProportionalTempo(notes.length);
    lastPlayedNotesRef.current = notes;
    lastPlayedTempoRef.current = tempo;
    console.log(`[Audio] Playing full melody (${notes.length} notes) at tempo ${tempo}ms`);
    
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
    
    notes.forEach((note, index) => {
      const timeout = setTimeout(() => {
        playNote(note);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: index,
          progress: (index + 1) / notes.length,
        }));
      }, index * adjustedTempo);
      playbackTimeoutsRef.current.push(timeout);
    });

    const endTimeout = setTimeout(() => {
      if (isLooping) {
        playFullMelody(notes, onComplete);
      } else {
        setPlaybackState(DEFAULT_PLAYBACK_STATE);
        onComplete?.();
      }
    }, notes.length * adjustedTempo + 400);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [playNote, stopPlayback, isLooping]);

  const playSnippet = useCallback((notes: string[], onComplete?: () => void) => {
    stopPlayback();
    const baseTempo = getProportionalTempo(notes.length);
    lastPlayedNotesRef.current = notes;
    lastPlayedTempoRef.current = baseTempo;
    console.log(`[Audio] Playing snippet (${notes.length} notes): ${notes.slice(0, 5).join(', ')}...`);
    
    setPlaybackState({
      isPlaying: true,
      isPaused: false,
      isLooping,
      currentNoteIndex: 0,
      totalNotes: notes.length,
      progress: 0,
      mode: 'snippet',
    });

    const tempo = baseTempo / audioSettingsRef.current.playbackSpeed;
    
    notes.forEach((note, index) => {
      const timeout = setTimeout(() => {
        playNote(note);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: index,
          progress: (index + 1) / notes.length,
        }));
      }, index * tempo);
      playbackTimeoutsRef.current.push(timeout);
    });

    const endTimeout = setTimeout(() => {
      if (isLooping) {
        playSnippet(notes, onComplete);
      } else {
        setPlaybackState(DEFAULT_PLAYBACK_STATE);
        onComplete?.();
      }
    }, notes.length * tempo + 400);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [playNote, stopPlayback, isLooping]);

  const playHintNotes = useCallback((notes: string[], count: number = 3) => {
    const hintNotes = notes.slice(0, Math.min(count, notes.length));
    console.log(`[Audio] Playing hint notes: ${hintNotes.join(', ')}`);
    
    stopPlayback();
    lastPlayedNotesRef.current = hintNotes;
    lastPlayedTempoRef.current = 500;
    
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
        playNote(note);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: index,
          progress: (index + 1) / hintNotes.length,
        }));
      }, index * tempo);
      playbackTimeoutsRef.current.push(timeout);
    });

    const endTimeout = setTimeout(() => {
      setPlaybackState(DEFAULT_PLAYBACK_STATE);
    }, hintNotes.length * tempo + 400);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [playNote, stopPlayback]);

  const playTeaser = useCallback((notes: string[], duration: number = 5) => {
    const teaserCount = Math.min(Math.ceil(notes.length * 0.4), Math.floor(duration / 0.5));
    const teaserNotes = notes.slice(0, Math.max(3, teaserCount));
    console.log(`[Audio] Playing teaser (${duration}s): ${teaserNotes.join(', ')}`);
    
    stopPlayback();
    lastPlayedNotesRef.current = teaserNotes;
    lastPlayedTempoRef.current = 450;
    
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
        playNote(note);
        setPlaybackState(prev => ({
          ...prev,
          currentNoteIndex: index,
          progress: (index + 1) / teaserNotes.length,
        }));
      }, index * tempo);
      playbackTimeoutsRef.current.push(timeout);
    });

    const endTimeout = setTimeout(() => {
      setPlaybackState(DEFAULT_PLAYBACK_STATE);
    }, teaserNotes.length * tempo + 400);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [playNote, stopPlayback]);

  const playNotePreview = useCallback((note: string) => {
    console.log(`[Audio] Playing note preview: ${note}`);
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
    console.log(`[Audio] Preloading ${notes.length} notes for ${instId}`);
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
    console.log(`[Audio] Volume set to ${clampedVolume}`);
  }, []);

  const updatePlaybackSpeed = useCallback((speed: number) => {
    const clampedSpeed = Math.max(0.5, Math.min(2, speed));
    setPlaybackSpeed(clampedSpeed);
    console.log(`[Audio] Playback speed set to ${clampedSpeed}x`);
  }, []);

  const fadeToVolume = useCallback((targetVolume: number, durationMs: number = 500) => {
    const startVolume = volume;
    const steps = 20;
    const stepDuration = durationMs / steps;
    const volumeStep = (targetVolume - startVolume) / steps;
    
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        const newVol = startVolume + (volumeStep * i);
        setVolume(Math.max(0, Math.min(1, newVol)));
      }, stepDuration * i);
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
  };
}
