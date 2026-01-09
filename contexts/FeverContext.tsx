import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { MELODIES, Melody, INTERNATIONAL_MELODIES } from '@/utils/melodies';
import { getFeedback, isWin, GuessResult } from '@/utils/gameLogic';

export interface FeverStats {
  highScore: number;
  totalGames: number;
  bestChain: number;
  totalSolved: number;
  totalCoinsEarned: number;
  longestFeverDuration: number;
}

const STORAGE_KEY = 'melodyx_fever_stats';

const DEFAULT_FEVER_STATS: FeverStats = {
  highScore: 0,
  totalGames: 0,
  bestChain: 0,
  totalSolved: 0,
  totalCoinsEarned: 0,
  longestFeverDuration: 0,
};

const FEVER_REWARDS = {
  basePoints: 1000,
  guessBonus: 200,
  feverBonus: 500,
  chainBonusMultiplier: 50,
  coinsPerSolve: 10,
  coinsPerFeverSolve: 25,
  hintsPerMilestone: 1,
} as const;

export type FeverGenreFilter = 'all' | 'pop' | 'rock' | 'classical' | 'movie' | 'game' | 'folk' | 'viral';

const GENRE_MAPPING: Record<FeverGenreFilter, string[]> = {
  all: [],
  pop: ['Pop', '80s', 'Viral', 'Meme'],
  rock: ['Rock'],
  classical: ['Classical'],
  movie: ['Movie', 'TV', 'Disney'],
  game: ['Video Game'],
  folk: ['Folk', 'International'],
  viral: ['Viral', 'Meme', 'Pop Culture'],
};

const EXPANDED_MELODY_POOL = [...MELODIES, ...INTERNATIONAL_MELODIES];

function getSmartRandomMelody(
  excludeNames: string[] = [],
  genreFilter: FeverGenreFilter = 'all',
  userHistory: string[] = [],
  chain: number = 0
): Melody {
  let pool = EXPANDED_MELODY_POOL;
  
  if (genreFilter !== 'all') {
    const allowedGenres = GENRE_MAPPING[genreFilter];
    pool = pool.filter(m => 
      allowedGenres.some(g => m.genre?.includes(g) || m.category?.includes(g))
    );
  }
  
  const available = pool.filter(m => !excludeNames.includes(m.name));
  
  if (available.length === 0) {
    pool = EXPANDED_MELODY_POOL;
  } else {
    pool = available;
  }
  
  const leastPlayed = pool.filter(m => !userHistory.includes(m.name));
  if (leastPlayed.length > 10) {
    pool = leastPlayed;
  }
  
  if (chain > 0 && chain % 5 === 0) {
    const rareMelodies = pool.filter(m => m.country || m.era === 'Traditional');
    if (rareMelodies.length > 3) {
      pool = rareMelodies;
    }
  }
  
  const weights = pool.map((m, idx) => {
    let weight = 1;
    if (!userHistory.includes(m.name)) weight += 2;
    if (m.mood === 'energetic' && chain >= 5) weight += 1;
    if (m.country) weight += 0.5;
    return { melody: m, weight, index: idx };
  });
  
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of weights) {
    random -= item.weight;
    if (random <= 0) {
      return item.melody;
    }
  }
  
  return pool[Math.floor(Math.random() * pool.length)];
}

export const [FeverProvider, useFever] = createContextHook(() => {
  const queryClient = useQueryClient();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMelody, setCurrentMelody] = useState<Melody | null>(null);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<GuessResult[][]>([]);
  const [score, setScore] = useState(0);
  const [chain, setChain] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [isFeverActive, setIsFeverActive] = useState(false);
  const [feverTimeLeft, setFeverTimeLeft] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [recentMelodies, setRecentMelodies] = useState<string[]>([]);
  const [solvedCount, setSolvedCount] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [hintsEarned, setHintsEarned] = useState(0);
  const [feverDuration, setFeverDuration] = useState(0);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [lastReward, setLastReward] = useState<{ coins: number; hints: number; type: string } | null>(null);
  const [genreFilter, setGenreFilter] = useState<FeverGenreFilter>('all');
  const [playHistory, setPlayHistory] = useState<string[]>([]);
  const [powerUps, setPowerUps] = useState({ timeFreeze: 0, doublePoints: 0, skipSong: 0 });
  const [isPaused, setIsPaused] = useState(false);
  
  const feverTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feverStartTimeRef = useRef<number | null>(null);

  const statsQuery = useQuery({
    queryKey: ['feverStats'],
    queryFn: async (): Promise<FeverStats> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.log('Error loading fever stats:', error);
      }
      return DEFAULT_FEVER_STATS;
    },
  });

  const { mutate: saveStats } = useMutation({
    mutationFn: async (stats: FeverStats) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
      return stats;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feverStats'] });
    },
  });

  const melodyLength = currentMelody?.notes.length ?? 6;

  useEffect(() => {
    if (isFeverActive && feverTimeLeft > 0) {
      if (!feverStartTimeRef.current) {
        feverStartTimeRef.current = Date.now();
      }
      
      feverTimerRef.current = setInterval(() => {
        setFeverTimeLeft(prev => {
          if (prev <= 1) {
            const duration = feverStartTimeRef.current 
              ? Math.floor((Date.now() - feverStartTimeRef.current) / 1000)
              : 30;
            setFeverDuration(d => d + duration);
            feverStartTimeRef.current = null;
            setIsFeverActive(false);
            setMultiplier(Math.max(1, multiplier - 1));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (feverTimerRef.current) {
        clearInterval(feverTimerRef.current);
      }
    };
  }, [isFeverActive, feverTimeLeft, multiplier]);

  const startGame = useCallback((filter: FeverGenreFilter = genreFilter) => {
    const melody = getSmartRandomMelody([], filter, playHistory, 0);
    setCurrentMelody(melody);
    setRecentMelodies([melody.name]);
    setCurrentGuess([]);
    setGuesses([]);
    setScore(0);
    setChain(0);
    setMultiplier(1);
    setIsFeverActive(false);
    setFeverTimeLeft(0);
    setGameOver(false);
    setIsPlaying(true);
    setSolvedCount(0);
    setCoinsEarned(0);
    setHintsEarned(0);
    setFeverDuration(0);
    setShowRewardPopup(false);
    setLastReward(null);
    setIsPaused(false);
    feverStartTimeRef.current = null;
    console.log('[Fever] Game started with melody:', melody.name, 'filter:', filter);
  }, [genreFilter, playHistory]);

  const nextMelody = useCallback(() => {
    const melody = getSmartRandomMelody(
      recentMelodies.slice(-8),
      genreFilter,
      playHistory,
      chain
    );
    setCurrentMelody(melody);
    setRecentMelodies(prev => [...prev.slice(-7), melody.name]);
    setPlayHistory(prev => [...prev.slice(-50), melody.name]);
    setCurrentGuess([]);
    setGuesses([]);
    console.log('[Fever] Next melody:', melody.name, 'chain:', chain);
  }, [recentMelodies, genreFilter, playHistory, chain]);

  const addNote = useCallback((note: string) => {
    if (!isPlaying || gameOver || !currentMelody) return;
    setCurrentGuess(prev => {
      if (prev.length >= melodyLength) return prev;
      return [...prev, note];
    });
  }, [isPlaying, gameOver, currentMelody, melodyLength]);

  const removeNote = useCallback(() => {
    if (!isPlaying || gameOver) return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [isPlaying, gameOver]);

  const submitGuess = useCallback(() => {
    if (!currentMelody || currentGuess.length !== melodyLength || gameOver) return;

    const feedback = getFeedback(currentGuess, currentMelody.notes);
    const won = isWin(feedback);
    const newGuesses = [...guesses, feedback];
    
    setGuesses(newGuesses);

    if (won) {
      const { basePoints, guessBonus, feverBonus, chainBonusMultiplier, coinsPerSolve, coinsPerFeverSolve } = FEVER_REWARDS;
      const guessPoints = Math.max(0, (6 - newGuesses.length) * guessBonus);
      const chainBonus = chain * chainBonusMultiplier;
      const feverPoints = isFeverActive ? feverBonus : 0;
      const earnedPoints = (basePoints + guessPoints + chainBonus + feverPoints) * multiplier;
      
      const earnedCoins = isFeverActive ? coinsPerFeverSolve : coinsPerSolve;
      const earnedHints = (chain + 1) % 5 === 0 ? 1 : 0;
      
      setScore(prev => prev + earnedPoints);
      setChain(prev => prev + 1);
      setSolvedCount(prev => prev + 1);
      setCoinsEarned(prev => prev + earnedCoins);
      setHintsEarned(prev => prev + earnedHints);
      
      if (earnedHints > 0 || isFeverActive) {
        setLastReward({ 
          coins: earnedCoins, 
          hints: earnedHints, 
          type: isFeverActive ? 'fever' : 'chain'
        });
        setShowRewardPopup(true);
        setTimeout(() => setShowRewardPopup(false), 1500);
      }
      
      const newChain = chain + 1;
      
      if (newChain >= 10 && !isFeverActive) {
        setIsFeverActive(true);
        setFeverTimeLeft(30);
        setMultiplier(3);
        feverStartTimeRef.current = Date.now();
        console.log('[Fever] FEVER MODE ACTIVATED!');
      } else if (newChain >= 5 && newChain < 10) {
        setMultiplier(2);
      }
      
      console.log(`[Fever] Solved! +${earnedPoints} pts, +${earnedCoins} coins, chain: ${newChain}`);
      setTimeout(() => nextMelody(), 1000);
    } else if (newGuesses.length >= 6) {
      setChain(0);
      setMultiplier(1);
      setIsFeverActive(false);
      setGameOver(true);
      
      const currentStats = statsQuery.data ?? DEFAULT_FEVER_STATS;
      const newStats: FeverStats = {
        highScore: Math.max(currentStats.highScore, score),
        totalGames: currentStats.totalGames + 1,
        bestChain: Math.max(currentStats.bestChain, chain),
        totalSolved: currentStats.totalSolved + solvedCount,
        totalCoinsEarned: currentStats.totalCoinsEarned + coinsEarned,
        longestFeverDuration: Math.max(currentStats.longestFeverDuration, feverDuration),
      };
      saveStats(newStats);
      console.log('[Fever] Game Over! Final stats:', newStats);
    }

    setCurrentGuess([]);
  }, [currentMelody, currentGuess, melodyLength, gameOver, guesses, multiplier, chain, isFeverActive, nextMelody, score, solvedCount, coinsEarned, feverDuration, statsQuery.data, saveStats]);

  const endGame = useCallback(() => {
    const currentStats = statsQuery.data ?? DEFAULT_FEVER_STATS;
    const newStats: FeverStats = {
      highScore: Math.max(currentStats.highScore, score),
      totalGames: currentStats.totalGames + 1,
      bestChain: Math.max(currentStats.bestChain, chain),
      totalSolved: currentStats.totalSolved + solvedCount,
      totalCoinsEarned: currentStats.totalCoinsEarned + coinsEarned,
      longestFeverDuration: Math.max(currentStats.longestFeverDuration, feverDuration),
    };
    saveStats(newStats);
    
    setIsPlaying(false);
    setGameOver(true);
    console.log('[Fever] Game ended manually. Earned:', { coins: coinsEarned, hints: hintsEarned });
  }, [score, chain, solvedCount, coinsEarned, hintsEarned, feverDuration, statsQuery.data, saveStats]);

  const dismissRewardPopup = useCallback(() => {
    setShowRewardPopup(false);
  }, []);

  const changeGenreFilter = useCallback((filter: FeverGenreFilter) => {
    setGenreFilter(filter);
    console.log('[Fever] Genre filter changed to:', filter);
  }, []);

  const usePowerUp = useCallback((type: 'timeFreeze' | 'doublePoints' | 'skipSong') => {
    if (powerUps[type] <= 0) return false;
    
    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
    
    switch (type) {
      case 'timeFreeze':
        if (isFeverActive) {
          setFeverTimeLeft(prev => Math.min(prev + 10, 30));
        }
        break;
      case 'doublePoints':
        setMultiplier(prev => prev * 2);
        setTimeout(() => setMultiplier(prev => prev / 2), 15000);
        break;
      case 'skipSong':
        nextMelody();
        break;
    }
    
    console.log('[Fever] Power-up used:', type);
    return true;
  }, [powerUps, isFeverActive, nextMelody]);

  const togglePause = useCallback(() => {
    if (!isFeverActive) {
      setIsPaused(prev => !prev);
    }
  }, [isFeverActive]);

  const totalMelodiesAvailable = useMemo(() => {
    if (genreFilter === 'all') return EXPANDED_MELODY_POOL.length;
    const allowedGenres = GENRE_MAPPING[genreFilter];
    return EXPANDED_MELODY_POOL.filter(m => 
      allowedGenres.some(g => m.genre?.includes(g) || m.category?.includes(g))
    ).length;
  }, [genreFilter]);

  return {
    isPlaying,
    currentMelody,
    currentGuess,
    guesses,
    melodyLength,
    score,
    chain,
    multiplier,
    isFeverActive,
    feverTimeLeft,
    gameOver,
    stats: statsQuery.data ?? DEFAULT_FEVER_STATS,
    solvedCount,
    coinsEarned,
    hintsEarned,
    showRewardPopup,
    lastReward,
    startGame,
    addNote,
    removeNote,
    submitGuess,
    endGame,
    dismissRewardPopup,
    genreFilter,
    changeGenreFilter,
    powerUps,
    usePowerUp,
    isPaused,
    togglePause,
    totalMelodiesAvailable,
    playHistory,
  };
});
