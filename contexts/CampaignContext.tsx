import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { 
  CampaignPuzzle, 
  CampaignProgress,
  PlayerCampaignStats,
  CAMPAIGN_WORLDS,
  getPuzzleById 
} from '@/constants/campaign';
import { getFeedback, isWin, GuessResult } from '@/utils/gameLogic';

export interface CampaignGameState {
  currentPuzzleId: string | null;
  guesses: GuessResult[][];
  gameStatus: 'playing' | 'won' | 'lost';
  starsEarned: number;
}

const STORAGE_KEYS = {
  CAMPAIGN_STATS: 'melodyx_campaign_stats',
  CAMPAIGN_PROGRESS: 'melodyx_campaign_progress',
  CAMPAIGN_GAME: 'melodyx_campaign_game',
};

const DEFAULT_STATS: PlayerCampaignStats = {
  totalStars: 0,
  totalCoins: 0,
  totalXp: 0,
  currentWorld: 'melody_meadows',
  completedPuzzles: [],
  unlockedWorlds: ['melody_meadows'],
  badges: [],
};

export const [CampaignProvider, useCampaign] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [showStory, setShowStory] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [showReward, setShowReward] = useState(false);

  const statsQuery = useQuery({
    queryKey: ['campaignStats'],
    queryFn: async (): Promise<PlayerCampaignStats> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CAMPAIGN_STATS);
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_STATS;
    },
  });

  const progressQuery = useQuery({
    queryKey: ['campaignProgress'],
    queryFn: async (): Promise<CampaignProgress[]> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CAMPAIGN_PROGRESS);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    },
  });

  const gameQuery = useQuery({
    queryKey: ['campaignGame'],
    queryFn: async (): Promise<CampaignGameState> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CAMPAIGN_GAME);
      if (stored) {
        return JSON.parse(stored);
      }
      return {
        currentPuzzleId: null,
        guesses: [],
        gameStatus: 'playing',
        starsEarned: 0,
      };
    },
  });

  const { mutate: saveStats } = useMutation({
    mutationFn: async (stats: PlayerCampaignStats) => {
      await AsyncStorage.setItem(STORAGE_KEYS.CAMPAIGN_STATS, JSON.stringify(stats));
      return stats;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignStats'] });
    },
  });

  const { mutate: saveProgress } = useMutation({
    mutationFn: async (progress: CampaignProgress[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.CAMPAIGN_PROGRESS, JSON.stringify(progress));
      return progress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignProgress'] });
    },
  });

  const { mutate: saveGame } = useMutation({
    mutationFn: async (gameState: CampaignGameState) => {
      await AsyncStorage.setItem(STORAGE_KEYS.CAMPAIGN_GAME, JSON.stringify(gameState));
      return gameState;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignGame'] });
    },
  });

  const stats = statsQuery.data ?? DEFAULT_STATS;
  
  const progress = useMemo(() => {
    return progressQuery.data ?? [];
  }, [progressQuery.data]);
  
  const gameState = useMemo(() => {
    return gameQuery.data ?? {
      currentPuzzleId: null,
      guesses: [],
      gameStatus: 'playing' as const,
      starsEarned: 0,
    };
  }, [gameQuery.data]);

  const currentPuzzle = useMemo<CampaignPuzzle | null>(() => {
    if (!gameState.currentPuzzleId) return null;
    return getPuzzleById(gameState.currentPuzzleId) ?? null;
  }, [gameState.currentPuzzleId]);

  const worlds = useMemo(() => {
    return CAMPAIGN_WORLDS.map(world => ({
      ...world,
      isUnlocked: stats.unlockedWorlds.includes(world.id),
      completedPuzzles: world.chapters.reduce((acc, chapter) => {
        return acc + chapter.puzzles.filter(p => stats.completedPuzzles.includes(p.id)).length;
      }, 0),
      totalPuzzles: world.chapters.reduce((acc, chapter) => acc + chapter.puzzles.length, 0),
    }));
  }, [stats.unlockedWorlds, stats.completedPuzzles]);

  const getPuzzleProgress = useCallback((puzzleId: string): CampaignProgress | null => {
    return progress.find(p => p.puzzleId === puzzleId) ?? null;
  }, [progress]);

  const getWorldProgress = useCallback((worldId: string) => {
    const world = CAMPAIGN_WORLDS.find(w => w.id === worldId);
    if (!world) return { completed: 0, total: 0, stars: 0, maxStars: 0 };

    let completed = 0;
    let total = 0;
    let stars = 0;
    let maxStars = 0;

    world.chapters.forEach(chapter => {
      chapter.puzzles.forEach(puzzle => {
        total++;
        maxStars += 3;
        const puzzleProgress = getPuzzleProgress(puzzle.id);
        if (puzzleProgress?.completed) {
          completed++;
          stars += puzzleProgress.starsEarned;
        }
      });
    });

    return { completed, total, stars, maxStars };
  }, [getPuzzleProgress]);

  const startPuzzle = useCallback((puzzle: CampaignPuzzle) => {
    const chapter = CAMPAIGN_WORLDS
      .flatMap(w => w.chapters)
      .find(c => c.puzzles.some(p => p.id === puzzle.id));

    if (chapter?.storyIntro && !stats.completedPuzzles.some(id => 
      chapter.puzzles.some(p => p.id === id)
    )) {
      setStoryText(chapter.storyIntro);
      setShowStory(true);
    }

    const newGameState: CampaignGameState = {
      currentPuzzleId: puzzle.id,
      guesses: [],
      gameStatus: 'playing',
      starsEarned: 0,
    };
    saveGame(newGameState);
    setCurrentGuess([]);
  }, [saveGame, stats.completedPuzzles]);

  const addNote = useCallback((note: string) => {
    if (!currentPuzzle || gameState.gameStatus !== 'playing') return;
    setCurrentGuess(prev => {
      if (prev.length >= currentPuzzle.notes.length) return prev;
      return [...prev, note];
    });
  }, [currentPuzzle, gameState.gameStatus]);

  const removeNote = useCallback(() => {
    if (gameState.gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [gameState.gameStatus]);

  const submitGuess = useCallback(() => {
    if (!currentPuzzle) return;
    if (currentGuess.length !== currentPuzzle.notes.length || gameState.gameStatus !== 'playing') return;

    const feedback = getFeedback(currentGuess, currentPuzzle.notes);
    const won = isWin(feedback);
    const newGuesses = [...gameState.guesses, feedback];
    const lost = newGuesses.length >= currentPuzzle.maxGuesses && !won;

    let starsEarned = 0;
    if (won) {
      if (newGuesses.length <= 2) starsEarned = 3;
      else if (newGuesses.length <= 4) starsEarned = 2;
      else starsEarned = 1;
    }

    const newGameState: CampaignGameState = {
      ...gameState,
      guesses: newGuesses,
      gameStatus: won ? 'won' : lost ? 'lost' : 'playing',
      starsEarned,
    };

    saveGame(newGameState);

    if (won) {
      const existingProgress = getPuzzleProgress(currentPuzzle.id);
      const previousStars = existingProgress?.starsEarned ?? 0;
      const starDiff = Math.max(0, starsEarned - previousStars);

      const newProgress: CampaignProgress = {
        worldId: stats.currentWorld,
        chapterId: '',
        puzzleId: currentPuzzle.id,
        completed: true,
        starsEarned: Math.max(starsEarned, previousStars),
        guessesUsed: newGuesses.length,
        completedAt: new Date().toISOString(),
      };

      const updatedProgress = progress.filter(p => p.puzzleId !== currentPuzzle.id);
      updatedProgress.push(newProgress);
      saveProgress(updatedProgress);

      const isFirstComplete = !stats.completedPuzzles.includes(currentPuzzle.id);
      
      const newStats: PlayerCampaignStats = {
        ...stats,
        totalStars: stats.totalStars + starDiff,
        totalCoins: stats.totalCoins + (isFirstComplete ? currentPuzzle.rewards.coins : 0),
        totalXp: stats.totalXp + (isFirstComplete ? currentPuzzle.rewards.xp : 0),
        completedPuzzles: isFirstComplete 
          ? [...stats.completedPuzzles, currentPuzzle.id]
          : stats.completedPuzzles,
        badges: currentPuzzle.rewards.badge && !stats.badges.includes(currentPuzzle.rewards.badge)
          ? [...stats.badges, currentPuzzle.rewards.badge]
          : stats.badges,
      };

      CAMPAIGN_WORLDS.forEach(world => {
        if (!newStats.unlockedWorlds.includes(world.id)) {
          if (newStats.totalStars >= world.unlockRequirement) {
            newStats.unlockedWorlds.push(world.id);
          }
        }
      });

      saveStats(newStats);
      setShowReward(true);
    }

    setCurrentGuess([]);
  }, [currentGuess, currentPuzzle, gameState, progress, stats, saveGame, saveProgress, saveStats, getPuzzleProgress]);

  const exitPuzzle = useCallback(() => {
    saveGame({
      currentPuzzleId: null,
      guesses: [],
      gameStatus: 'playing',
      starsEarned: 0,
    });
    setCurrentGuess([]);
    setShowReward(false);
  }, [saveGame]);

  const retryPuzzle = useCallback(() => {
    if (!currentPuzzle) return;
    saveGame({
      currentPuzzleId: currentPuzzle.id,
      guesses: [],
      gameStatus: 'playing',
      starsEarned: 0,
    });
    setCurrentGuess([]);
    setShowReward(false);
  }, [currentPuzzle, saveGame]);

  return {
    stats,
    progress,
    gameState,
    currentPuzzle,
    currentGuess,
    worlds,
    isLoading: statsQuery.isLoading || progressQuery.isLoading || gameQuery.isLoading,
    startPuzzle,
    addNote,
    removeNote,
    submitGuess,
    exitPuzzle,
    retryPuzzle,
    getPuzzleProgress,
    getWorldProgress,
    showStory,
    setShowStory,
    storyText,
    showReward,
    setShowReward,
  };
});
