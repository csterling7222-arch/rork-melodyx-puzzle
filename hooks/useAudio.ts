import { useCallback, useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Instrument, getInstrumentById, DEFAULT_INSTRUMENT_ID } from '@/constants/instruments';

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
  currentNoteIndex: number;
  totalNotes: number;
  progress: number;
}

let audioContextInstance: AudioContext | null = null;
let audioInitialized = false;

const soundCache = new Map<string, Map<string, Audio.Sound>>();
const preloadQueue = new Set<string>();
let isPreloading = false;
let currentInstrumentId = DEFAULT_INSTRUMENT_ID;
const MAX_CACHE_SIZE = 60;
const PRELOAD_BATCH_SIZE = 4;
const PRELOAD_DELAY_MS = 30;

function getWebAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  
  try {
    if (!audioContextInstance) {
      const win = window as typeof window & { webkitAudioContext?: typeof AudioContext };
      const AudioContextClass = win.AudioContext || win.webkitAudioContext;
      if (AudioContextClass) {
        audioContextInstance = new AudioContextClass();
        console.log('Web AudioContext created successfully');
      }
    }
    return audioContextInstance;
  } catch (error) {
    console.log('Failed to create Web AudioContext:', error);
    return null;
  }
}

async function initNativeAudio() {
  if (audioInitialized || Platform.OS === 'web') return true;
  
  try {
    console.log('Initializing native audio...');
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    audioInitialized = true;
    console.log('Native audio initialized successfully');
    return true;
  } catch (error) {
    console.log('Failed to initialize native audio:', error);
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

async function preloadSound(note: string, instrumentId: string = currentInstrumentId): Promise<Audio.Sound | null> {
  if (Platform.OS === 'web') return null;
  
  const cache = getInstrumentCache(instrumentId);
  if (cache.has(note)) return cache.get(note) || null;
  
  const cacheKey = `${instrumentId}_${note}`;
  if (preloadQueue.has(cacheKey)) return null;
  
  preloadQueue.add(cacheKey);
  
  try {
    const instrument = getInstrumentById(instrumentId);
    const fileName = NOTE_TO_FILE[note] || 'C4';
    const url = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${instrument.soundfontName}-mp3/${fileName}.mp3`;
    
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: false, volume: 1.0 }
    );
    
    cache.set(note, sound);
    console.log(`Preloaded ${instrumentId} sound for ${note}`);
    return sound;
  } catch (error) {
    console.log(`Failed to preload ${instrumentId} ${note}:`, error);
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

export function useAudio(instrumentId?: string) {
  const playbackTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isLoadingRef = useRef<Set<string>>(new Set());
  const currentInstrumentRef = useRef<Instrument>(getInstrumentById(instrumentId || DEFAULT_INSTRUMENT_ID));
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentNoteIndex: -1,
    totalNotes: 0,
    progress: 0,
  });

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
        console.log('No web audio context available');
        return;
      }

      if (ctx.state === 'suspended') {
        ctx.resume().catch(e => console.log('Resume error:', e));
      }

      const frequency = NOTE_FREQUENCIES[note];
      if (!frequency) {
        console.log('Unknown note:', note);
        return;
      }

      const instrument = currentInstrumentRef.current;
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
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + attackTime);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(0.01, sustainLevel * 0.5), ctx.currentTime + duration * 0.7);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration + releaseTime);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration + releaseTime + 0.05);

      console.log(`[Audio] Web: Playing ${note} on ${instrument.name}`);
    } catch (error) {
      console.log('Web audio error:', error);
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
        console.log('Unknown note:', note);
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
            await sound.playAsync();
          }
        } catch (playError) {
          console.log(`Play error for ${note}:`, playError);
          cache.delete(note);
        }
      }
    } catch (error) {
      console.log(`Native audio error for ${note}:`, error);
    }
  }, []);

  const playNote = useCallback((note: string) => {
    console.log(`playNote: ${note} on ${Platform.OS}`);
    if (Platform.OS === 'web') {
      playNoteWeb(note);
    } else {
      playNoteNative(note);
    }
  }, [playNoteWeb, playNoteNative]);

  const stopPlayback = useCallback(() => {
    playbackTimeoutsRef.current.forEach(clearTimeout);
    playbackTimeoutsRef.current = [];
    setPlaybackState({
      isPlaying: false,
      currentNoteIndex: -1,
      totalNotes: 0,
      progress: 0,
    });
  }, []);

  const playMelody = useCallback((notes: string[], tempo: number = 400) => {
    stopPlayback();
    console.log(`Playing melody: ${notes.join(', ')}`);
    
    setPlaybackState({
      isPlaying: true,
      currentNoteIndex: 0,
      totalNotes: notes.length,
      progress: 0,
    });

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
      setPlaybackState({
        isPlaying: false,
        currentNoteIndex: -1,
        totalNotes: 0,
        progress: 1,
      });
    }, notes.length * tempo + 300);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [playNote, stopPlayback]);

  const playSnippet = useCallback((notes: string[], onComplete?: () => void) => {
    stopPlayback();
    console.log(`Playing snippet: ${notes.join(', ')}`);
    
    setPlaybackState({
      isPlaying: true,
      currentNoteIndex: 0,
      totalNotes: notes.length,
      progress: 0,
    });

    const tempo = 350;
    
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
      setPlaybackState({
        isPlaying: false,
        currentNoteIndex: -1,
        totalNotes: 0,
        progress: 1,
      });
      onComplete?.();
    }, notes.length * tempo + 400);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [playNote, stopPlayback]);

  const playHintNotes = useCallback((notes: string[], count: number = 3) => {
    const hintNotes = notes.slice(0, Math.min(count, notes.length));
    console.log(`Playing hint notes: ${hintNotes.join(', ')}`);
    
    stopPlayback();
    setPlaybackState({
      isPlaying: true,
      currentNoteIndex: 0,
      totalNotes: hintNotes.length,
      progress: 0,
    });

    const tempo = 500;
    
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
      setPlaybackState({
        isPlaying: false,
        currentNoteIndex: -1,
        totalNotes: 0,
        progress: 1,
      });
    }, hintNotes.length * tempo + 400);
    playbackTimeoutsRef.current.push(endTimeout);
  }, [playNote, stopPlayback]);

  return { 
    playNote, 
    playMelody, 
    playSnippet,
    playHintNotes,
    stopPlayback,
    playbackState,
  };
}
