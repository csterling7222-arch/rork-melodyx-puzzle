import { useCallback, useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';

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

export function useAudio() {
  const playbackTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const soundsRef = useRef<Map<string, Audio.Sound>>(new Map());
  const isLoadingRef = useRef<Set<string>>(new Set());
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentNoteIndex: -1,
    totalNotes: 0,
    progress: 0,
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      initNativeAudio();
    }
    
    const timeouts = playbackTimeoutsRef.current;
    const sounds = soundsRef.current;
    
    return () => {
      timeouts.forEach(clearTimeout);
      sounds.forEach(sound => {
        sound.unloadAsync().catch(() => {});
      });
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

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filterNode = ctx.createBiquadFilter();

      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(2000, ctx.currentTime);

      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration + 0.05);

      console.log(`Web: Playing ${note} at ${frequency}Hz`);
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

      let sound = soundsRef.current.get(note);
      
      if (!sound && !isLoadingRef.current.has(note)) {
        isLoadingRef.current.add(note);
        
        const noteToFile: Record<string, string> = {
          'C': 'C4', 'C#': 'Db4', 'D': 'D4', 'D#': 'Eb4',
          'E': 'E4', 'F': 'F4', 'F#': 'Gb4', 'G': 'G4',
          'G#': 'Ab4', 'A': 'A4', 'A#': 'Bb4', 'B': 'B4',
        };
        
        const fileName = noteToFile[note] || 'C4';
        const url = `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/${fileName}.mp3`;
        
        try {
          console.log(`Loading sound for ${note}...`);
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: url },
            { shouldPlay: false, volume: 1.0 }
          );
          soundsRef.current.set(note, newSound);
          sound = newSound;
          console.log(`Sound loaded for ${note}`);
        } catch (loadError) {
          console.log(`Failed to load sound for ${note}:`, loadError);
        } finally {
          isLoadingRef.current.delete(note);
        }
      }

      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            await sound.setPositionAsync(0);
            await sound.playAsync();
            console.log(`Playing note ${note}`);
          }
        } catch (playError) {
          console.log(`Play error for ${note}:`, playError);
          soundsRef.current.delete(note);
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
