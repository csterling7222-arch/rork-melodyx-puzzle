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

const MAX_MULTIPLIER = 5;
const MAX_CHAIN = 100;

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

const ADDITIONAL_VIRAL_SONGS: Melody[] = [
  { name: "Gangnam Style", notes: ["E", "E", "E", "E", "D", "D"], extendedNotes: ["E", "E", "E", "E", "D", "D", "E", "G", "A", "G", "E", "D"], hint: "Oppan Gangnam Style", category: "Viral", genre: "Viral", era: "2010s", mood: "energetic", artist: "PSY" },
  { name: "Somebody That I Used", notes: ["F", "G", "A", "G", "F", "E"], extendedNotes: ["F", "G", "A", "G", "F", "E", "D", "F", "G", "A", "C", "A"], hint: "But you didn't have to cut me off", category: "Pop", genre: "Pop", era: "2010s", mood: "nostalgic", artist: "Gotye" },
  { name: "Call Me Maybe", notes: ["G", "A", "B", "G", "E", "D"], extendedNotes: ["G", "A", "B", "G", "E", "D", "C", "D", "E", "G", "A", "B"], hint: "Hey I just met you", category: "Pop", genre: "Pop", era: "2010s", mood: "upbeat", artist: "Carly Rae Jepsen" },
  { name: "Shake It Off", notes: ["D", "D", "E", "D", "B", "G"], extendedNotes: ["D", "D", "E", "D", "B", "G", "A", "B", "D", "E", "D", "B"], hint: "Players gonna play play", category: "Pop", genre: "Pop", era: "2010s", mood: "upbeat", artist: "Taylor Swift" },
  { name: "Thriller", notes: ["E", "E", "D", "E", "G", "E"], extendedNotes: ["E", "E", "D", "E", "G", "E", "D", "C", "D", "E", "G", "A"], hint: "This is thriller night", category: "80s", genre: "80s", era: "80s", mood: "mysterious", artist: "Michael Jackson" },
  { name: "Don't Stop Believin", notes: ["E", "F#", "G", "A", "B", "A"], extendedNotes: ["E", "F#", "G", "A", "B", "A", "G", "F#", "E", "D", "E", "G"], hint: "Just a small town girl", category: "80s", genre: "Rock", era: "80s", mood: "epic", artist: "Journey" },
  { name: "Livin On A Prayer", notes: ["E", "G", "A", "B", "A", "G"], extendedNotes: ["E", "G", "A", "B", "A", "G", "E", "D", "E", "G", "A", "B"], hint: "Woah we're halfway there", category: "80s", genre: "Rock", era: "80s", mood: "energetic", artist: "Bon Jovi" },
  { name: "Toxic", notes: ["B", "C", "D", "E", "D", "C"], extendedNotes: ["B", "C", "D", "E", "D", "C", "B", "A", "G#", "A", "B", "C"], hint: "Baby can't you see", category: "Pop", genre: "Pop", era: "2000s", mood: "mysterious", artist: "Britney Spears" },
  { name: "Crazy In Love", notes: ["F", "G", "A", "F", "D", "C"], extendedNotes: ["F", "G", "A", "F", "D", "C", "D", "F", "G", "A", "C", "A"], hint: "Got me looking so crazy right now", category: "Pop", genre: "Pop", era: "2000s", mood: "energetic", artist: "Beyoncé" },
  { name: "Hotline Bling", notes: ["C#", "E", "F#", "G#", "F#", "E"], extendedNotes: ["C#", "E", "F#", "G#", "F#", "E", "C#", "B", "C#", "E", "F#", "G#"], hint: "You used to call me", category: "Pop", genre: "Pop", era: "2010s", mood: "nostalgic", artist: "Drake" },
  { name: "Levitating", notes: ["B", "B", "A", "G#", "A", "B"], extendedNotes: ["B", "B", "A", "G#", "A", "B", "C#", "D#", "E", "D#", "C#", "B"], hint: "You want me I want you baby", category: "Pop", genre: "Pop", era: "2020s", mood: "upbeat", artist: "Dua Lipa" },
  { name: "Watermelon Sugar", notes: ["E", "G", "A", "B", "A", "G"], extendedNotes: ["E", "G", "A", "B", "A", "G", "E", "D", "E", "G", "A", "B"], hint: "Tastes like strawberries", category: "Pop", genre: "Pop", era: "2020s", mood: "upbeat", artist: "Harry Styles" },
  { name: "drivers license", notes: ["G", "A", "B", "C", "B", "A"], extendedNotes: ["G", "A", "B", "C", "B", "A", "G", "F#", "G", "A", "B", "C"], hint: "I got my driver's license", category: "Pop", genre: "Pop", era: "2020s", mood: "nostalgic", artist: "Olivia Rodrigo" },
  { name: "Stay", notes: ["F", "G", "A", "A#", "A", "G"], extendedNotes: ["F", "G", "A", "A#", "A", "G", "F", "E", "F", "G", "A", "A#"], hint: "I do the same thing I told you", category: "Pop", genre: "Pop", era: "2020s", mood: "energetic", artist: "The Kid LAROI" },
  { name: "As It Was", notes: ["B", "C#", "D#", "E", "D#", "C#"], extendedNotes: ["B", "C#", "D#", "E", "D#", "C#", "B", "A#", "B", "C#", "D#", "E"], hint: "In this world it's just us", category: "Pop", genre: "Pop", era: "2020s", mood: "nostalgic", artist: "Harry Styles" },
  { name: "Anti-Hero", notes: ["G", "A", "B", "D", "B", "A"], extendedNotes: ["G", "A", "B", "D", "B", "A", "G", "F#", "G", "A", "B", "D"], hint: "It's me hi I'm the problem", category: "Pop", genre: "Pop", era: "2020s", mood: "playful", artist: "Taylor Swift" },
  { name: "Flowers", notes: ["E", "G", "A", "B", "A", "G"], extendedNotes: ["E", "G", "A", "B", "A", "G", "E", "D", "E", "G", "A", "B"], hint: "I can buy myself flowers", category: "Pop", genre: "Pop", era: "2020s", mood: "upbeat", artist: "Miley Cyrus" },
  { name: "Heat Waves", notes: ["A", "B", "C#", "D", "C#", "B"], extendedNotes: ["A", "B", "C#", "D", "C#", "B", "A", "G#", "A", "B", "C#", "D"], hint: "Late nights in the middle of June", category: "Pop", genre: "Pop", era: "2020s", mood: "nostalgic", artist: "Glass Animals" },
  { name: "Peaches", notes: ["E", "F#", "G#", "A", "G#", "F#"], extendedNotes: ["E", "F#", "G#", "A", "G#", "F#", "E", "D#", "E", "F#", "G#", "A"], hint: "I got my peaches out in Georgia", category: "Pop", genre: "Pop", era: "2020s", mood: "upbeat", artist: "Justin Bieber" },
  { name: "Dynamite", notes: ["G", "A", "B", "D", "B", "A"], extendedNotes: ["G", "A", "B", "D", "B", "A", "G", "E", "G", "A", "B", "D"], hint: "Light it up like dynamite", category: "Pop", genre: "Pop", era: "2020s", mood: "energetic", artist: "BTS" },
];

const FULL_SONG_LIBRARY = [...EXPANDED_MELODY_POOL, ...ADDITIONAL_VIRAL_SONGS];

function getSmartRandomMelody(
  excludeNames: string[] = [],
  genreFilter: FeverGenreFilter = 'all',
  userHistory: string[] = [],
  chain: number = 0,
  accuracy: number = 0.5
): Melody {
  let pool = FULL_SONG_LIBRARY;
  
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
  
  if (accuracy > 0.8 && chain > 3) {
    const harderSongs = pool.filter(m => m.notes.length >= 7 || m.mood === 'mysterious');
    if (harderSongs.length > 5) {
      pool = harderSongs;
    }
  } else if (accuracy < 0.3) {
    const easierSongs = pool.filter(m => m.notes.length <= 6 && (m.mood === 'playful' || m.mood === 'upbeat'));
    if (easierSongs.length > 5) {
      pool = easierSongs;
    }
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
  const [solvedMelody, setSolvedMelody] = useState<Melody | null>(null);
  const [showSolvedPopup, setShowSolvedPopup] = useState(false);
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

  const multiplierRef = useRef(multiplier);
  multiplierRef.current = multiplier;

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
            setMultiplier(Math.max(1, multiplierRef.current - 1));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (feverTimerRef.current) {
        clearInterval(feverTimerRef.current);
        feverTimerRef.current = null;
      }
    };
  }, [isFeverActive, feverTimeLeft]);

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
    setSolvedMelody(null);
    setShowSolvedPopup(false);
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
      
      // Show solved popup with song name
      setSolvedMelody(currentMelody);
      setShowSolvedPopup(true);
      
      if (earnedHints > 0 || isFeverActive) {
        setLastReward({ 
          coins: earnedCoins, 
          hints: earnedHints, 
          type: isFeverActive ? 'fever' : 'chain'
        });
        setShowRewardPopup(true);
        setTimeout(() => setShowRewardPopup(false), 1500);
      }
      
      const newChain = Math.min(chain + 1, MAX_CHAIN);
      
      if (newChain >= 10 && !isFeverActive) {
        setIsFeverActive(true);
        setFeverTimeLeft(30);
        setMultiplier(Math.min(3, MAX_MULTIPLIER));
        feverStartTimeRef.current = Date.now();
        console.log('[Fever] FEVER MODE ACTIVATED!');
      } else if (newChain >= 5 && newChain < 10) {
        setMultiplier(Math.min(2, MAX_MULTIPLIER));
      }
      
      console.log(`[Fever] Solved! +${earnedPoints} pts, +${earnedCoins} coins, chain: ${newChain}`);
      setTimeout(() => {
        setShowSolvedPopup(false);
        nextMelody();
      }, 1800);
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
    if (genreFilter === 'all') return FULL_SONG_LIBRARY.length;
    const allowedGenres = GENRE_MAPPING[genreFilter];
    return FULL_SONG_LIBRARY.filter(m => 
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
    solvedMelody,
    showSolvedPopup,
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
