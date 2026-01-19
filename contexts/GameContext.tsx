import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getDailyMelody, getDailyPuzzleNumber } from '@/utils/melodies';
import { getFeedback, isWin, GuessResult } from '@/utils/gameLogic';
import { aiChooseSong, AISelection } from '@/utils/aiSongChooser';

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
  lastPlayedDate: string | null;
}

export interface DailyGameState {
  date: string;
  guesses: GuessResult[][];
  gameStatus: 'playing' | 'won' | 'lost';
  hintUsed: boolean;
  audioHintUsed: boolean;
}

const STORAGE_KEYS = {
  STATS: 'melodyx_stats',
  DAILY_GAME: 'melodyx_daily_game',
};

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

async function asyncStorageRetry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRY_ATTEMPTS
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`[Game] AsyncStorage operation failed (attempt ${attempt}/${retries}):`, error);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }
  throw new Error('AsyncStorage operation failed after retries');
}

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0],
  lastPlayedDate: null,
};

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

export const [GameProvider, useGame] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [shouldNavigateHome, setShouldNavigateHome] = useState(false);
  const [gameEndTime, setGameEndTime] = useState<number | null>(null);
  const [shouldAutoPlaySnippet, setShouldAutoPlaySnippet] = useState(false);
  const gameStartTimeRef = useRef<number>(Date.now());
  const pendingSaveRef = useRef<{ stats: GameStats | null; dailyGame: DailyGameState | null }>({
    stats: null,
    dailyGame: null,
  });

  const aiSelection = useMemo<AISelection>(() => aiChooseSong(), []);
  const melody = useMemo(() => getDailyMelody(), []);
  const puzzleNumber = useMemo(() => getDailyPuzzleNumber(), []);
  const targetNotes = melody.notes;
  const melodyLength = targetNotes.length;

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('[Game] App going to background, force saving pending data...');
        try {
          if (pendingSaveRef.current.stats) {
            await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(pendingSaveRef.current.stats));
            console.log('[Game] Force saved stats on background');
          }
          if (pendingSaveRef.current.dailyGame) {
            await AsyncStorage.setItem(STORAGE_KEYS.DAILY_GAME, JSON.stringify(pendingSaveRef.current.dailyGame));
            console.log('[Game] Force saved daily game on background');
          }
        } catch (error) {
          console.error('[Game] Error force saving on background:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: async (): Promise<GameStats> => {
      try {
        console.log('[Game] Loading stats from AsyncStorage...');
        const stored = await asyncStorageRetry(() => AsyncStorage.getItem(STORAGE_KEYS.STATS));
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('[Game] Loaded stats:', JSON.stringify(parsed));
          console.log('[Game] Games played:', parsed.gamesPlayed, 'Games won:', parsed.gamesWon, 'Current streak:', parsed.currentStreak);
          return parsed;
        }
        console.log('[Game] No stats found, creating defaults and saving...');
        await asyncStorageRetry(() => AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(DEFAULT_STATS)));
        return DEFAULT_STATS;
      } catch (error) {
        console.error('[Game] Error loading stats:', error);
        return DEFAULT_STATS;
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const dailyGameQuery = useQuery({
    queryKey: ['dailyGame'],
    queryFn: async (): Promise<DailyGameState | null> => {
      try {
        console.log('[Game] Loading daily game from AsyncStorage...');
        const stored = await asyncStorageRetry(() => AsyncStorage.getItem(STORAGE_KEYS.DAILY_GAME));
        if (stored) {
          const parsed = JSON.parse(stored) as DailyGameState;
          const today = getTodayString();
          console.log('[Game] Stored date:', parsed.date, 'Today:', today);
          if (parsed.date === today) {
            console.log('[Game] Loaded daily game:', JSON.stringify(parsed));
            console.log('[Game] Game status:', parsed.gameStatus, 'Guesses:', parsed.guesses.length);
            return parsed;
          }
          console.log('[Game] Daily game is from a different day, resetting');
        } else {
          console.log('[Game] No daily game found in storage');
        }
      } catch (error) {
        console.error('[Game] Error loading daily game:', error);
      }
      return null;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const { mutate: saveStats } = useMutation({
    mutationFn: async (stats: GameStats) => {
      try {
        pendingSaveRef.current.stats = stats;
        const serialized = JSON.stringify(stats);
        await asyncStorageRetry(() => AsyncStorage.setItem(STORAGE_KEYS.STATS, serialized));
        console.log('[Game] Saved stats - Games played:', stats.gamesPlayed, 'Won:', stats.gamesWon, 'Streak:', stats.currentStreak);
        
        const verification = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
        if (verification !== serialized) {
          console.error('[Game] STATS SAVE VERIFICATION FAILED! Retrying...');
          await asyncStorageRetry(() => AsyncStorage.setItem(STORAGE_KEYS.STATS, serialized));
        } else {
          console.log('[Game] Stats save verification passed');
          pendingSaveRef.current.stats = null;
        }
        return stats;
      } catch (error) {
        console.error('[Game] Error saving stats:', error);
        throw error;
      }
    },
    onSuccess: (savedStats) => {
      queryClient.setQueryData(['stats'], savedStats);
    },
    onError: (error) => {
      console.error('[Game] Stats mutation error:', error);
    },
    retry: 3,
  });

  const { mutate: saveDailyGame } = useMutation({
    mutationFn: async (gameState: DailyGameState) => {
      try {
        pendingSaveRef.current.dailyGame = gameState;
        const serialized = JSON.stringify(gameState);
        await asyncStorageRetry(() => AsyncStorage.setItem(STORAGE_KEYS.DAILY_GAME, serialized));
        console.log('[Game] Saved daily game - Status:', gameState.gameStatus, 'Guesses:', gameState.guesses.length);
        
        const verification = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_GAME);
        if (verification !== serialized) {
          console.error('[Game] DAILY GAME SAVE VERIFICATION FAILED! Retrying...');
          await asyncStorageRetry(() => AsyncStorage.setItem(STORAGE_KEYS.DAILY_GAME, serialized));
        } else {
          console.log('[Game] Daily game save verification passed');
          pendingSaveRef.current.dailyGame = null;
        }
        return gameState;
      } catch (error) {
        console.error('[Game] Error saving daily game:', error);
        throw error;
      }
    },
    onSuccess: (savedGame) => {
      queryClient.setQueryData(['dailyGame'], savedGame);
    },
    onError: (error) => {
      console.error('[Game] Daily game mutation error:', error);
    },
    retry: 3,
  });

  const guesses = useMemo(() => dailyGameQuery.data?.guesses ?? [], [dailyGameQuery.data?.guesses]);
  const gameStatus = dailyGameQuery.data?.gameStatus ?? 'playing';
  const hintUsed = dailyGameQuery.data?.hintUsed ?? false;
  const audioHintUsed = dailyGameQuery.data?.audioHintUsed ?? false;

  const addNote = useCallback((note: string) => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => {
      if (prev.length >= melodyLength) return prev;
      return [...prev, note];
    });
  }, [gameStatus, melodyLength]);

  const removeNote = useCallback(() => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [gameStatus]);

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== melodyLength || gameStatus !== 'playing') return;

    const feedback = getFeedback(currentGuess, targetNotes);
    const won = isWin(feedback);
    const newGuesses = [...guesses, feedback];
    const lost = newGuesses.length >= 6 && !won;

    const newGameState: DailyGameState = {
      date: getTodayString(),
      guesses: newGuesses,
      gameStatus: won ? 'won' : lost ? 'lost' : 'playing',
      hintUsed,
      audioHintUsed,
    };

    saveDailyGame(newGameState);

    if (won || lost) {
      const currentStats = statsQuery.data ?? DEFAULT_STATS;
      const today = getTodayString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;

      const isConsecutive = currentStats.lastPlayedDate === yesterdayString;
      const newStreak = won ? (isConsecutive ? currentStats.currentStreak + 1 : 1) : 0;

      const newDistribution = [...currentStats.guessDistribution];
      if (won) {
        newDistribution[newGuesses.length - 1]++;
      }

      const newStats: GameStats = {
        gamesPlayed: currentStats.gamesPlayed + 1,
        gamesWon: currentStats.gamesWon + (won ? 1 : 0),
        currentStreak: newStreak,
        maxStreak: Math.max(currentStats.maxStreak, newStreak),
        guessDistribution: newDistribution,
        lastPlayedDate: today,
      };

      saveStats(newStats);
      setGameEndTime(Date.now());
      
      if (Platform.OS !== 'web') {
        if (won) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
      
      setTimeout(() => {
        setShowModal(true);
        setShouldNavigateHome(true);
        if (won) {
          setShouldAutoPlaySnippet(true);
        }
      }, 1200);
    }

    setCurrentGuess([]);
  }, [currentGuess, melodyLength, gameStatus, targetNotes, guesses, hintUsed, audioHintUsed, statsQuery.data, saveDailyGame, saveStats]);

  const activateHint = useCallback(() => {
    if (guesses.length < 3 || hintUsed) return;
    setShowHint(true);
    const currentGame = dailyGameQuery.data;
    if (currentGame) {
      saveDailyGame({ ...currentGame, hintUsed: true });
    } else {
      saveDailyGame({
        date: getTodayString(),
        guesses: [],
        gameStatus: 'playing',
        hintUsed: true,
        audioHintUsed: false,
      });
    }
  }, [guesses.length, hintUsed, dailyGameQuery.data, saveDailyGame]);

  const activateAudioHint = useCallback(() => {
    if (guesses.length < 2 || audioHintUsed || gameStatus !== 'playing') return false;
    const currentGame = dailyGameQuery.data;
    if (currentGame) {
      saveDailyGame({ ...currentGame, audioHintUsed: true });
    } else {
      saveDailyGame({
        date: getTodayString(),
        guesses: [],
        gameStatus: 'playing',
        hintUsed: false,
        audioHintUsed: true,
      });
    }
    return true;
  }, [guesses.length, audioHintUsed, gameStatus, dailyGameQuery.data, saveDailyGame]);

  const canUseHint = guesses.length >= 3 && !hintUsed && gameStatus === 'playing';
  const canUseAudioHint = guesses.length >= 2 && !audioHintUsed && gameStatus === 'playing';

  const solveTimeSeconds = gameEndTime && gameStartTimeRef.current 
    ? Math.round((gameEndTime - gameStartTimeRef.current) / 1000)
    : 0;

  const clearNavigationFlag = useCallback(() => {
    setShouldNavigateHome(false);
  }, []);

  return {
    melody,
    puzzleNumber,
    targetNotes,
    melodyLength,
    currentGuess,
    guesses,
    gameStatus,
    stats: statsQuery.data ?? DEFAULT_STATS,
    isLoading: statsQuery.isLoading || dailyGameQuery.isLoading,
    addNote,
    removeNote,
    submitGuess,
    activateHint,
    canUseHint,
    showHint,
    setShowHint,
    showModal,
    setShowModal,
    hintUsed,
    aiSelection,
    audioHintUsed,
    activateAudioHint,
    canUseAudioHint,
    shouldNavigateHome,
    clearNavigationFlag,
    solveTimeSeconds,
    shouldAutoPlaySnippet,
    setShouldAutoPlaySnippet,
  };
});
