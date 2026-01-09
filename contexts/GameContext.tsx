import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
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
  const gameStartTimeRef = useRef<number>(Date.now());

  const aiSelection = useMemo<AISelection>(() => aiChooseSong(), []);
  const melody = useMemo(() => getDailyMelody(), []);
  const puzzleNumber = useMemo(() => getDailyPuzzleNumber(), []);
  const targetNotes = melody.notes;
  const melodyLength = targetNotes.length;

  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: async (): Promise<GameStats> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.STATS);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.log('Error loading stats:', error);
      }
      return DEFAULT_STATS;
    },
  });

  const dailyGameQuery = useQuery({
    queryKey: ['dailyGame'],
    queryFn: async (): Promise<DailyGameState | null> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_GAME);
        if (stored) {
          const parsed = JSON.parse(stored) as DailyGameState;
          if (parsed.date === getTodayString()) {
            return parsed;
          }
        }
      } catch (error) {
        console.log('Error loading daily game:', error);
      }
      return null;
    },
  });

  const { mutate: saveStats } = useMutation({
    mutationFn: async (stats: GameStats) => {
      await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
      return stats;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const { mutate: saveDailyGame } = useMutation({
    mutationFn: async (gameState: DailyGameState) => {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_GAME, JSON.stringify(gameState));
      return gameState;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyGame'] });
    },
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
  };
});
