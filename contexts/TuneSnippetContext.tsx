import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { captureError, addBreadcrumb } from '@/utils/errorTracking';
import { usePurchases } from '@/contexts/PurchasesContext';

const SNIPPET_CACHE_KEY = 'melodyx_snippet_cache_v1';
const MAX_CACHE_SIZE_MB = 100;
const TEASER_DURATION_MS = 5000;

export interface SnippetMetadata {
  songId: string;
  snippetUrl: string;
  teaserUrl?: string;
  fullTrackUrl?: string;
  durationMs: number;
  bitrate: 'low' | 'medium' | 'high';
  isLicensed: boolean;
  source: 'midi' | 'sample' | 'licensed' | 'epidemic';
  attribution?: string;
}

export interface PlaybackProgress {
  positionMs: number;
  durationMs: number;
  progress: number;
  isBuffering: boolean;
}

export interface SnippetPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isLooping: boolean;
  isBuffering: boolean;
  currentSongId: string | null;
  mode: 'idle' | 'teaser' | 'snippet' | 'full' | 'preview';
  progress: PlaybackProgress;
  volume: number;
  playbackSpeed: number;
  error: string | null;
}

const DEFAULT_PLAYBACK_STATE: SnippetPlaybackState = {
  isPlaying: false,
  isPaused: false,
  isLooping: false,
  isBuffering: false,
  currentSongId: null,
  mode: 'idle',
  progress: {
    positionMs: 0,
    durationMs: 0,
    progress: 0,
    isBuffering: false,
  },
  volume: 1.0,
  playbackSpeed: 1.0,
  error: null,
};

interface CachedSnippet {
  songId: string;
  localUri: string;
  cachedAt: number;
  sizeBytes: number;
}

let audioInitialized = false;

async function initAudioMode(): Promise<boolean> {
  if (audioInitialized || Platform.OS === 'web') return true;
  
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioInitialized = true;
    console.log('[TuneSnippet] Audio mode initialized');
    return true;
  } catch (error) {
    console.error('[TuneSnippet] Failed to initialize audio mode:', error);
    captureError(error, { tags: { component: 'TuneSnippet', action: 'initAudioMode' } });
    return false;
  }
}

export const [TuneSnippetProvider, useTuneSnippet] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { isPremium } = usePurchases();
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [playbackState, setPlaybackState] = useState<SnippetPlaybackState>(DEFAULT_PLAYBACK_STATE);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'low' | 'medium' | 'high'>('high');

  const cachedSnippetsQuery = useQuery({
    queryKey: ['cachedSnippets'],
    queryFn: async (): Promise<CachedSnippet[]> => {
      try {
        const stored = await AsyncStorage.getItem(SNIPPET_CACHE_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.log('[TuneSnippet] Error loading cache:', error);
        return [];
      }
    },
  });

  useMutation({
    mutationFn: async (snippets: CachedSnippet[]) => {
      await AsyncStorage.setItem(SNIPPET_CACHE_KEY, JSON.stringify(snippets));
      return snippets;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cachedSnippets'] });
    },
  });

  useEffect(() => {
    initAudioMode();
    
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const cleanupSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        console.log('[TuneSnippet] Sound cleaned up');
      }
    } catch (error) {
      console.log('[TuneSnippet] Error cleaning up sound:', error);
    }
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const getAdaptiveUrl = useCallback((snippet: SnippetMetadata): string => {
    if (networkQuality === 'low' && snippet.teaserUrl) {
      return snippet.teaserUrl;
    }
    return snippet.snippetUrl;
  }, [networkQuality]);

  const fadeVolume = useCallback(async (targetVolume: number, durationMs: number = 500) => {
    if (!soundRef.current) return;
    
    const steps = 20;
    const stepDuration = durationMs / steps;
    const currentVolume = playbackState.volume;
    const volumeStep = (targetVolume - currentVolume) / steps;
    
    let currentStep = 0;
    
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }
    
    fadeIntervalRef.current = setInterval(async () => {
      currentStep++;
      const newVolume = currentVolume + (volumeStep * currentStep);
      
      try {
        if (soundRef.current) {
          await soundRef.current.setVolumeAsync(Math.max(0, Math.min(1, newVolume)));
          setPlaybackState(prev => ({ ...prev, volume: newVolume }));
        }
      } catch (error) {
        console.log('[TuneSnippet] Fade volume error:', error);
      }
      
      if (currentStep >= steps && fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    }, stepDuration);
  }, [playbackState.volume]);

  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(async () => {
      if (!soundRef.current) return;
      
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          const positionMs = status.positionMillis;
          const durationMs = status.durationMillis || 0;
          const progress = durationMs > 0 ? positionMs / durationMs : 0;
          
          setPlaybackState(prev => ({
            ...prev,
            progress: {
              positionMs,
              durationMs,
              progress,
              isBuffering: status.isBuffering,
            },
            isBuffering: status.isBuffering,
          }));
          
          if (!status.isPlaying && !status.isBuffering) {
            setPlaybackState(prev => {
              if (prev.isPlaying) {
                return {
                  ...prev,
                  isPlaying: false,
                  mode: 'idle',
                };
              }
              return prev;
            });
          }
        }
      } catch (error) {
        console.log('[TuneSnippet] Progress tracking error:', error);
      }
    }, 100);
  }, []);

  const playSnippet = useCallback(async (
    snippet: SnippetMetadata,
    mode: 'teaser' | 'snippet' | 'full' = 'snippet',
    options?: { fadeIn?: boolean; startPosition?: number }
  ) => {
    console.log('[TuneSnippet] Playing snippet:', snippet.songId, 'mode:', mode);
    addBreadcrumb({ category: 'audio', message: `Playing snippet: ${snippet.songId}`, level: 'info' });
    
    await cleanupSound();
    await initAudioMode();
    
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: false,
      isBuffering: true,
      currentSongId: snippet.songId,
      mode,
      error: null,
    }));
    
    try {
      const url = getAdaptiveUrl(snippet);
      console.log('[TuneSnippet] Loading URL:', url);
      
      const initialVolume = options?.fadeIn ? 0 : playbackState.volume;
      
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: url },
        {
          shouldPlay: true,
          volume: initialVolume,
          rate: playbackState.playbackSpeed,
          isLooping: playbackState.isLooping,
          progressUpdateIntervalMillis: 100,
          positionMillis: options?.startPosition || 0,
        },
        (status: AVPlaybackStatus) => {
          if (status.isLoaded) {
            if (status.didJustFinish && !status.isLooping) {
              console.log('[TuneSnippet] Playback finished');
              setPlaybackState(prev => ({
                ...prev,
                isPlaying: false,
                mode: 'idle',
                progress: { ...prev.progress, progress: 1 },
              }));
              
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }
          }
        }
      );
      
      soundRef.current = sound;
      
      const durationMs = status.isLoaded ? (status.durationMillis || snippet.durationMs) : snippet.durationMs;
      
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: true,
        isBuffering: false,
        progress: {
          positionMs: 0,
          durationMs,
          progress: 0,
          isBuffering: false,
        },
      }));
      
      startProgressTracking();
      
      if (options?.fadeIn) {
        await fadeVolume(playbackState.volume, 300);
      }
      
      if (mode === 'teaser' && !isPremium) {
        setTimeout(async () => {
          await fadeVolume(0, 500);
          setTimeout(async () => {
            await cleanupSound();
            setPlaybackState(prev => ({
              ...prev,
              isPlaying: false,
              isPaused: false,
              isBuffering: false,
              mode: 'idle',
              currentSongId: null,
              progress: { positionMs: 0, durationMs: 0, progress: 0, isBuffering: false },
            }));
          }, 600);
        }, TEASER_DURATION_MS - 500);
      }
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      console.log('[TuneSnippet] Playback started successfully');
      
    } catch (error) {
      console.error('[TuneSnippet] Error playing snippet:', error);
      captureError(error, { tags: { component: 'TuneSnippet', action: 'playSnippet', songId: snippet.songId } });
      
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: false,
        isBuffering: false,
        error: error instanceof Error ? error.message : 'Failed to play audio',
      }));
    }
  }, [cleanupSound, getAdaptiveUrl, playbackState.volume, playbackState.playbackSpeed, playbackState.isLooping, fadeVolume, startProgressTracking, isPremium]);

  const stopPlayback = useCallback(async () => {
    console.log('[TuneSnippet] Stopping playback');
    await cleanupSound();
    
    setPlaybackState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      isBuffering: false,
      mode: 'idle',
      currentSongId: null,
      progress: { positionMs: 0, durationMs: 0, progress: 0, isBuffering: false },
    }));
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [cleanupSound]);

  const pausePlayback = useCallback(async () => {
    if (!soundRef.current || !playbackState.isPlaying) return;
    
    try {
      await soundRef.current.pauseAsync();
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: true,
      }));
      console.log('[TuneSnippet] Playback paused');
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('[TuneSnippet] Error pausing:', error);
    }
  }, [playbackState.isPlaying]);

  const resumePlayback = useCallback(async () => {
    if (!soundRef.current || !playbackState.isPaused) return;
    
    try {
      await soundRef.current.playAsync();
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
      }));
      console.log('[TuneSnippet] Playback resumed');
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('[TuneSnippet] Error resuming:', error);
    }
  }, [playbackState.isPaused]);

  const seekTo = useCallback(async (positionMs: number) => {
    if (!soundRef.current) return;
    
    try {
      await soundRef.current.setPositionAsync(positionMs);
      setPlaybackState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          positionMs,
          progress: prev.progress.durationMs > 0 ? positionMs / prev.progress.durationMs : 0,
        },
      }));
      console.log('[TuneSnippet] Seeked to:', positionMs);
    } catch (error) {
      console.log('[TuneSnippet] Error seeking:', error);
    }
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(clampedVolume);
      } catch (error) {
        console.log('[TuneSnippet] Error setting volume:', error);
      }
    }
    
    setPlaybackState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  const setPlaybackSpeed = useCallback(async (speed: number) => {
    const clampedSpeed = Math.max(0.5, Math.min(2, speed));
    
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(clampedSpeed, true);
      } catch (error) {
        console.log('[TuneSnippet] Error setting speed:', error);
      }
    }
    
    setPlaybackState(prev => ({ ...prev, playbackSpeed: clampedSpeed }));
  }, []);

  const toggleLoop = useCallback(async () => {
    const newLooping = !playbackState.isLooping;
    
    if (soundRef.current) {
      try {
        await soundRef.current.setIsLoopingAsync(newLooping);
      } catch (error) {
        console.log('[TuneSnippet] Error toggling loop:', error);
      }
    }
    
    setPlaybackState(prev => ({ ...prev, isLooping: newLooping }));
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [playbackState.isLooping]);

  const replayFromStart = useCallback(async () => {
    if (!soundRef.current) return;
    
    try {
      await soundRef.current.setPositionAsync(0);
      if (!playbackState.isPlaying) {
        await soundRef.current.playAsync();
        setPlaybackState(prev => ({
          ...prev,
          isPlaying: true,
          isPaused: false,
        }));
      }
      console.log('[TuneSnippet] Replaying from start');
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.log('[TuneSnippet] Error replaying:', error);
    }
  }, [playbackState.isPlaying]);

  const isSnippetCached = useCallback((songId: string): boolean => {
    const cached = cachedSnippetsQuery.data ?? [];
    return cached.some(s => s.songId === songId);
  }, [cachedSnippetsQuery.data]);

  const getCacheStatus = useCallback(() => {
    const cached = cachedSnippetsQuery.data ?? [];
    const totalSizeMB = cached.reduce((acc, s) => acc + s.sizeBytes, 0) / (1024 * 1024);
    return {
      cachedCount: cached.length,
      totalSizeMB: Math.round(totalSizeMB * 10) / 10,
      maxSizeMB: MAX_CACHE_SIZE_MB,
    };
  }, [cachedSnippetsQuery.data]);

  const setOffline = useCallback((offline: boolean) => {
    setIsOfflineMode(offline);
    console.log('[TuneSnippet] Offline mode:', offline);
  }, []);

  const updateNetworkQuality = useCallback((quality: 'low' | 'medium' | 'high') => {
    setNetworkQuality(quality);
    console.log('[TuneSnippet] Network quality:', quality);
  }, []);

  return {
    playbackState,
    playSnippet,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    seekTo,
    setVolume,
    setPlaybackSpeed,
    toggleLoop,
    replayFromStart,
    fadeVolume,
    isSnippetCached,
    getCacheStatus,
    isOfflineMode,
    setOffline,
    networkQuality,
    updateNetworkQuality,
    isPremiumPlayback: isPremium,
  };
});
