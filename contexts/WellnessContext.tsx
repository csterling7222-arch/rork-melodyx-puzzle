import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { ZEN_MELODIES, ZenMelody, WELLNESS_ACHIEVEMENTS, BREATHING_PATTERNS, BreathingPatternKey } from '@/constants/wellness';

export interface WellnessStats {
  zenStreak: number;
  totalMinutes: number;
  puzzlesSolved: number;
  breathingSessions: number;
  lastZenDate: string | null;
  unlockedAchievements: string[];
}

export interface ZenGameState {
  currentPuzzleIndex: number;
  guesses: string[][];
  gameStatus: 'playing' | 'won' | 'lost';
  sessionStartTime: number | null;
  meditationCompleted: boolean;
}

const STORAGE_KEYS = {
  WELLNESS_STATS: 'melodyx_wellness_stats',
  ZEN_GAME: 'melodyx_zen_game',
};

const DEFAULT_STATS: WellnessStats = {
  zenStreak: 0,
  totalMinutes: 0,
  puzzlesSolved: 0,
  breathingSessions: 0,
  lastZenDate: null,
  unlockedAchievements: [],
};

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
}

export const [WellnessProvider, useWellness] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [showMeditation, setShowMeditation] = useState(false);
  const [selectedBreathing, setSelectedBreathing] = useState<BreathingPatternKey>('relaxing');
  const [isBreathing, setIsBreathing] = useState(false);

  const statsQuery = useQuery({
    queryKey: ['wellnessStats'],
    queryFn: async (): Promise<WellnessStats> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.WELLNESS_STATS);
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_STATS;
    },
  });

  const gameQuery = useQuery({
    queryKey: ['zenGame'],
    queryFn: async (): Promise<ZenGameState> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ZEN_GAME);
      if (stored) {
        return JSON.parse(stored);
      }
      return {
        currentPuzzleIndex: 0,
        guesses: [],
        gameStatus: 'playing',
        sessionStartTime: null,
        meditationCompleted: false,
      };
    },
  });

  const { mutate: saveStats } = useMutation({
    mutationFn: async (stats: WellnessStats) => {
      await AsyncStorage.setItem(STORAGE_KEYS.WELLNESS_STATS, JSON.stringify(stats));
      return stats;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wellnessStats'] });
    },
  });

  const { mutate: saveGame } = useMutation({
    mutationFn: async (gameState: ZenGameState) => {
      await AsyncStorage.setItem(STORAGE_KEYS.ZEN_GAME, JSON.stringify(gameState));
      return gameState;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zenGame'] });
    },
  });

  const stats = statsQuery.data ?? DEFAULT_STATS;
  
  const gameState = useMemo(() => {
    return gameQuery.data ?? {
      currentPuzzleIndex: 0,
      guesses: [],
      gameStatus: 'playing' as const,
      sessionStartTime: null,
      meditationCompleted: false,
    };
  }, [gameQuery.data]);

  const currentMelody = useMemo<ZenMelody>(() => {
    return ZEN_MELODIES[gameState.currentPuzzleIndex % ZEN_MELODIES.length];
  }, [gameState.currentPuzzleIndex]);

  const checkAchievements = useCallback((currentStats: WellnessStats): string[] => {
    const newUnlocks: string[] = [];
    
    WELLNESS_ACHIEVEMENTS.forEach(achievement => {
      if (currentStats.unlockedAchievements.includes(achievement.id)) return;
      
      let unlocked = false;
      switch (achievement.type) {
        case 'zen_streak':
          unlocked = currentStats.zenStreak >= achievement.requirement;
          break;
        case 'total_minutes':
          unlocked = currentStats.totalMinutes >= achievement.requirement;
          break;
        case 'puzzles_solved':
          unlocked = currentStats.puzzlesSolved >= achievement.requirement;
          break;
        case 'breathing_sessions':
          unlocked = currentStats.breathingSessions >= achievement.requirement;
          break;
      }
      
      if (unlocked) {
        newUnlocks.push(achievement.id);
      }
    });
    
    return newUnlocks;
  }, []);

  const addNote = useCallback((note: string) => {
    if (gameState.gameStatus !== 'playing') return;
    setCurrentGuess(prev => {
      if (prev.length >= currentMelody.notes.length) return prev;
      return [...prev, note];
    });
  }, [gameState.gameStatus, currentMelody.notes.length]);

  const removeNote = useCallback(() => {
    if (gameState.gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [gameState.gameStatus]);

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== currentMelody.notes.length || gameState.gameStatus !== 'playing') return;

    const isCorrect = currentGuess.every((note, i) => note === currentMelody.notes[i]);
    const newGuesses = [...gameState.guesses, currentGuess];
    const won = isCorrect;
    const lost = newGuesses.length >= 6 && !won;

    const newGameState: ZenGameState = {
      ...gameState,
      guesses: newGuesses,
      gameStatus: won ? 'won' : lost ? 'lost' : 'playing',
      sessionStartTime: gameState.sessionStartTime ?? Date.now(),
    };

    saveGame(newGameState);

    if (won) {
      const today = getTodayString();
      const yesterday = getYesterdayString();
      const isConsecutive = stats.lastZenDate === yesterday || stats.lastZenDate === today;
      const isNewDay = stats.lastZenDate !== today;

      const sessionMinutes = gameState.sessionStartTime 
        ? Math.round((Date.now() - gameState.sessionStartTime) / 60000)
        : 5;

      const newStats: WellnessStats = {
        ...stats,
        zenStreak: isNewDay ? (isConsecutive ? stats.zenStreak + 1 : 1) : stats.zenStreak,
        totalMinutes: stats.totalMinutes + Math.max(sessionMinutes, 1),
        puzzlesSolved: stats.puzzlesSolved + 1,
        lastZenDate: today,
        unlockedAchievements: stats.unlockedAchievements,
      };

      const newUnlocks = checkAchievements(newStats);
      newStats.unlockedAchievements = [...newStats.unlockedAchievements, ...newUnlocks];

      saveStats(newStats);
      setShowMeditation(true);
    }

    setCurrentGuess([]);
  }, [currentGuess, currentMelody.notes, gameState, stats, saveGame, saveStats, checkAchievements]);

  const nextPuzzle = useCallback(() => {
    const newGameState: ZenGameState = {
      currentPuzzleIndex: gameState.currentPuzzleIndex + 1,
      guesses: [],
      gameStatus: 'playing',
      sessionStartTime: Date.now(),
      meditationCompleted: false,
    };
    saveGame(newGameState);
    setCurrentGuess([]);
    setShowMeditation(false);
  }, [gameState.currentPuzzleIndex, saveGame]);

  const completeBreathingSession = useCallback(() => {
    const newStats: WellnessStats = {
      ...stats,
      breathingSessions: stats.breathingSessions + 1,
      totalMinutes: stats.totalMinutes + 2,
      unlockedAchievements: stats.unlockedAchievements,
    };

    const newUnlocks = checkAchievements(newStats);
    newStats.unlockedAchievements = [...newStats.unlockedAchievements, ...newUnlocks];

    saveStats(newStats);
    setIsBreathing(false);
  }, [stats, saveStats, checkAchievements]);

  const startBreathing = useCallback(() => {
    setIsBreathing(true);
  }, []);

  const getBreathingPattern = useCallback(() => {
    return BREATHING_PATTERNS[selectedBreathing];
  }, [selectedBreathing]);

  return {
    stats,
    gameState,
    currentMelody,
    currentGuess,
    isLoading: statsQuery.isLoading || gameQuery.isLoading,
    addNote,
    removeNote,
    submitGuess,
    nextPuzzle,
    showMeditation,
    setShowMeditation,
    selectedBreathing,
    setSelectedBreathing,
    isBreathing,
    startBreathing,
    completeBreathingSession,
    getBreathingPattern,
    zenMelodies: ZEN_MELODIES,
    achievements: WELLNESS_ACHIEVEMENTS,
  };
});
