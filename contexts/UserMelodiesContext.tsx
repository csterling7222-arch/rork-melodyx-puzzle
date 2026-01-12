import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import {
  UserMelody,
  MelodyChallenge,
  UGCGenre,
  UGCMood,
  UGCDifficulty,
  generateShareCode,
  MIN_NOTES,
  MAX_NOTES,
  CREATOR_REWARDS,
} from '@/constants/ugc';
import { useUser } from './UserContext';

const STORAGE_KEY = 'melodyx_user_melodies';
const PUBLIC_POOL_KEY = 'melodyx_public_melodies';
const CHALLENGES_KEY = 'melodyx_melody_challenges';

interface UserMelodiesState {
  myMelodies: UserMelody[];
  publicPool: UserMelody[];
  challenges: MelodyChallenge[];
  drafts: Partial<UserMelody>[];
}

const DEFAULT_STATE: UserMelodiesState = {
  myMelodies: [],
  publicPool: [],
  challenges: [],
  drafts: [],
};

function generateMelodyId(): string {
  return `melody_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateChallengeId(): string {
  return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function checkDuplicate(notes: string[], existingMelodies: UserMelody[]): boolean {
  const noteString = notes.join(',');
  return existingMelodies.some(m => m.notes.join(',') === noteString);
}

function checkOffensiveContent(title: string, hint: string): boolean {
  const offensivePatterns = [
    /\b(fuck|shit|ass|damn|bitch|crap|hell)\b/i,
  ];
  const combined = `${title} ${hint}`.toLowerCase();
  return offensivePatterns.some(pattern => pattern.test(combined));
}

function analyzeNotePattern(notes: string[]): { isLowQuality: boolean; reason?: string } {
  if (notes.length < MIN_NOTES) {
    return { isLowQuality: true, reason: 'Too few notes' };
  }
  if (notes.length > MAX_NOTES) {
    return { isLowQuality: true, reason: 'Too many notes' };
  }
  
  const uniqueNotes = new Set(notes);
  if (uniqueNotes.size < 3) {
    return { isLowQuality: true, reason: 'Too repetitive - use at least 3 different notes' };
  }
  
  let consecutiveSame = 1;
  for (let i = 1; i < notes.length; i++) {
    if (notes[i] === notes[i - 1]) {
      consecutiveSame++;
      if (consecutiveSame > 3) {
        return { isLowQuality: true, reason: 'Too many consecutive repeated notes' };
      }
    } else {
      consecutiveSame = 1;
    }
  }
  
  return { isLowQuality: false };
}

export interface MelodyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  flags: {
    isDuplicate: boolean;
    isOffensive: boolean;
    isLowQuality: boolean;
  };
}

export const [UserMelodiesProvider, useUserMelodies] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { profile, addCoins } = useUser();
  const [currentDraft, setCurrentDraft] = useState<Partial<UserMelody> | null>(null);

  const melodiesQuery = useQuery({
    queryKey: ['userMelodies', profile.id],
    queryFn: async (): Promise<UserMelodiesState> => {
      try {
        const [melodiesStr, publicStr, challengesStr] = await Promise.all([
          AsyncStorage.getItem(`${STORAGE_KEY}_${profile.id}`),
          AsyncStorage.getItem(PUBLIC_POOL_KEY),
          AsyncStorage.getItem(CHALLENGES_KEY),
        ]);

        const myMelodies = melodiesStr ? JSON.parse(melodiesStr) : [];
        const publicPool = publicStr ? JSON.parse(publicStr) : [];
        const challenges = challengesStr ? JSON.parse(challengesStr) : [];

        console.log('[UserMelodies] Loaded:', { 
          myMelodies: myMelodies.length, 
          publicPool: publicPool.length,
          challenges: challenges.length,
        });

        return { myMelodies, publicPool, challenges, drafts: [] };
      } catch (error) {
        console.log('[UserMelodies] Error loading:', error);
        return DEFAULT_STATE;
      }
    },
  });

  const { mutateAsync: saveState } = useMutation({
    mutationFn: async (state: UserMelodiesState) => {
      await Promise.all([
        AsyncStorage.setItem(`${STORAGE_KEY}_${profile.id}`, JSON.stringify(state.myMelodies)),
        AsyncStorage.setItem(PUBLIC_POOL_KEY, JSON.stringify(state.publicPool)),
        AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(state.challenges)),
      ]);
      return state;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMelodies'] });
    },
  });

  const state = melodiesQuery.data ?? DEFAULT_STATE;

  const validateMelody = useCallback((
    notes: string[],
    title: string,
    hint: string,
    excludeId?: string
  ): MelodyValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (notes.length < MIN_NOTES) {
      errors.push(`Melody must have at least ${MIN_NOTES} notes`);
    }
    if (notes.length > MAX_NOTES) {
      errors.push(`Melody cannot exceed ${MAX_NOTES} notes`);
    }
    if (!title.trim()) {
      errors.push('Title is required');
    }
    if (title.length > 40) {
      errors.push('Title must be 40 characters or less');
    }
    if (!hint.trim()) {
      errors.push('Hint is required');
    }
    if (hint.length > 100) {
      errors.push('Hint must be 100 characters or less');
    }

    const existingMelodies = [...state.myMelodies, ...state.publicPool]
      .filter(m => m.id !== excludeId);
    const isDuplicate = checkDuplicate(notes, existingMelodies);
    const isOffensive = checkOffensiveContent(title, hint);
    const qualityCheck = analyzeNotePattern(notes);

    if (isDuplicate) {
      warnings.push('This melody pattern already exists');
    }
    if (isOffensive) {
      errors.push('Content contains inappropriate language');
    }
    if (qualityCheck.isLowQuality && qualityCheck.reason) {
      warnings.push(qualityCheck.reason);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      flags: {
        isDuplicate,
        isOffensive,
        isLowQuality: qualityCheck.isLowQuality,
      },
    };
  }, [state.myMelodies, state.publicPool]);

  const createMelody = useCallback(async (
    title: string,
    notes: string[],
    hint: string,
    genre: UGCGenre,
    mood: UGCMood,
    difficulty: UGCDifficulty,
    isPublic: boolean = false
  ): Promise<{ success: boolean; melody?: UserMelody; error?: string }> => {
    const validation = validateMelody(notes, title, hint);
    
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    const melody: UserMelody = {
      id: generateMelodyId(),
      creatorId: profile.id,
      creatorName: profile.username,
      title: title.trim(),
      notes,
      hint: hint.trim(),
      genre,
      mood,
      difficulty,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      shareCode: generateShareCode(),
      isPublic,
      stats: {
        plays: 0,
        solves: 0,
        likes: 0,
        dislikes: 0,
        averageGuesses: 0,
      },
      flags: {
        isDuplicate: validation.flags.isDuplicate,
        isOffensive: validation.flags.isOffensive,
        isLowQuality: validation.flags.isLowQuality,
        moderationStatus: validation.flags.isDuplicate || validation.flags.isLowQuality 
          ? 'pending' 
          : 'approved',
      },
    };

    const newState: UserMelodiesState = {
      ...state,
      myMelodies: [...state.myMelodies, melody],
      publicPool: isPublic && melody.flags.moderationStatus === 'approved'
        ? [...state.publicPool, melody]
        : state.publicPool,
    };

    await saveState(newState);
    addCoins(CREATOR_REWARDS.melodyCreated);
    console.log('[UserMelodies] Created melody:', melody.id);

    return { success: true, melody };
  }, [state, profile, validateMelody, saveState, addCoins]);

  const updateMelody = useCallback(async (
    melodyId: string,
    updates: Partial<Pick<UserMelody, 'title' | 'hint' | 'notes' | 'genre' | 'mood' | 'difficulty' | 'isPublic'>>
  ): Promise<{ success: boolean; error?: string }> => {
    const melody = state.myMelodies.find(m => m.id === melodyId);
    if (!melody) {
      return { success: false, error: 'Melody not found' };
    }

    const newNotes = updates.notes ?? melody.notes;
    const newTitle = updates.title ?? melody.title;
    const newHint = updates.hint ?? melody.hint;

    const validation = validateMelody(newNotes, newTitle, newHint, melodyId);
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    const updatedMelody: UserMelody = {
      ...melody,
      ...updates,
      updatedAt: new Date().toISOString(),
      flags: {
        ...melody.flags,
        ...validation.flags,
        moderationStatus: validation.flags.isDuplicate || validation.flags.isLowQuality 
          ? 'pending' 
          : melody.flags.moderationStatus,
      },
    };

    const newMyMelodies = state.myMelodies.map(m => 
      m.id === melodyId ? updatedMelody : m
    );

    const newPublicPool = state.publicPool.map(m =>
      m.id === melodyId ? updatedMelody : m
    ).filter(m => m.isPublic);

    if (updatedMelody.isPublic && !state.publicPool.find(m => m.id === melodyId)) {
      if (updatedMelody.flags.moderationStatus === 'approved') {
        newPublicPool.push(updatedMelody);
      }
    }

    const newState: UserMelodiesState = {
      ...state,
      myMelodies: newMyMelodies,
      publicPool: newPublicPool,
    };

    await saveState(newState);
    console.log('[UserMelodies] Updated melody:', melodyId);

    return { success: true };
  }, [state, validateMelody, saveState]);

  const deleteMelody = useCallback(async (melodyId: string): Promise<boolean> => {
    const newState: UserMelodiesState = {
      ...state,
      myMelodies: state.myMelodies.filter(m => m.id !== melodyId),
      publicPool: state.publicPool.filter(m => m.id !== melodyId),
    };

    await saveState(newState);
    console.log('[UserMelodies] Deleted melody:', melodyId);
    return true;
  }, [state, saveState]);

  const getMelodyByShareCode = useCallback((shareCode: string): UserMelody | null => {
    const melody = [...state.myMelodies, ...state.publicPool]
      .find(m => m.shareCode === shareCode);
    return melody ?? null;
  }, [state.myMelodies, state.publicPool]);

  const getMelodyById = useCallback((melodyId: string): UserMelody | null => {
    const melody = [...state.myMelodies, ...state.publicPool]
      .find(m => m.id === melodyId);
    return melody ?? null;
  }, [state.myMelodies, state.publicPool]);

  const voteMelody = useCallback(async (
    melodyId: string,
    vote: 'like' | 'dislike'
  ): Promise<void> => {
    const updatePool = (melodies: UserMelody[]): UserMelody[] => {
      return melodies.map(m => {
        if (m.id !== melodyId) return m;
        return {
          ...m,
          stats: {
            ...m.stats,
            likes: vote === 'like' ? m.stats.likes + 1 : m.stats.likes,
            dislikes: vote === 'dislike' ? m.stats.dislikes + 1 : m.stats.dislikes,
          },
        };
      });
    };

    const newState: UserMelodiesState = {
      ...state,
      myMelodies: updatePool(state.myMelodies),
      publicPool: updatePool(state.publicPool),
    };

    await saveState(newState);

    const melody = state.publicPool.find(m => m.id === melodyId);
    if (melody && vote === 'like' && melody.creatorId !== profile.id) {
      console.log('[UserMelodies] Melody liked, creator gets reward');
    }
  }, [state, saveState, profile.id]);

  const recordMelodySolve = useCallback(async (
    melodyId: string,
    guesses: number,
    won: boolean
  ): Promise<void> => {
    const updatePool = (melodies: UserMelody[]): UserMelody[] => {
      return melodies.map(m => {
        if (m.id !== melodyId) return m;
        const newPlays = m.stats.plays + 1;
        const newSolves = won ? m.stats.solves + 1 : m.stats.solves;
        const totalGuesses = m.stats.averageGuesses * m.stats.plays + guesses;
        return {
          ...m,
          stats: {
            ...m.stats,
            plays: newPlays,
            solves: newSolves,
            averageGuesses: totalGuesses / newPlays,
          },
        };
      });
    };

    const newState: UserMelodiesState = {
      ...state,
      myMelodies: updatePool(state.myMelodies),
      publicPool: updatePool(state.publicPool),
    };

    await saveState(newState);
  }, [state, saveState]);

  const createChallenge = useCallback(async (
    melodyId: string,
    challengedUsernames: string[] = []
  ): Promise<MelodyChallenge | null> => {
    const melody = getMelodyById(melodyId);
    if (!melody) return null;

    const challenge: MelodyChallenge = {
      id: generateChallengeId(),
      melodyId,
      challengerId: profile.id,
      challengerName: profile.username,
      challengedIds: [],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      results: [],
    };

    const newState: UserMelodiesState = {
      ...state,
      challenges: [...state.challenges, challenge],
    };

    await saveState(newState);
    console.log('[UserMelodies] Created challenge:', challenge.id);

    return challenge;
  }, [state, profile, getMelodyById, saveState]);

  const submitChallengeResult = useCallback(async (
    challengeId: string,
    odId: string,
    odName: string,
    guesses: number,
    timeMs: number,
    won: boolean
  ): Promise<void> => {
    const newChallenges = state.challenges.map(c => {
      if (c.id !== challengeId) return c;
      return {
        ...c,
        results: [
          ...c.results,
          {
            odId,
            odName,
            guesses,
            timeMs,
            won,
            completedAt: new Date().toISOString(),
          },
        ],
      };
    });

    const newState: UserMelodiesState = {
      ...state,
      challenges: newChallenges,
    };

    await saveState(newState);
  }, [state, saveState]);

  const getPublicMelodies = useCallback((
    sortBy: 'newest' | 'popular' | 'trending' = 'newest',
    genre?: UGCGenre,
    mood?: UGCMood
  ): UserMelody[] => {
    let melodies = state.publicPool.filter(m => 
      m.flags.moderationStatus === 'approved' && !m.flags.isOffensive
    );

    if (genre) {
      melodies = melodies.filter(m => m.genre === genre);
    }
    if (mood) {
      melodies = melodies.filter(m => m.mood === mood);
    }

    switch (sortBy) {
      case 'popular':
        return melodies.sort((a, b) => b.stats.likes - a.stats.likes);
      case 'trending':
        return melodies.sort((a, b) => {
          const aScore = (a.stats.likes - a.stats.dislikes) / Math.max(1, a.stats.plays);
          const bScore = (b.stats.likes - b.stats.dislikes) / Math.max(1, b.stats.plays);
          return bScore - aScore;
        });
      case 'newest':
      default:
        return melodies.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [state.publicPool]);

  const creatorStats = useMemo(() => {
    const myMelodies = state.myMelodies;
    const totalPlays = myMelodies.reduce((sum, m) => sum + m.stats.plays, 0);
    const totalSolves = myMelodies.reduce((sum, m) => sum + m.stats.solves, 0);
    const totalLikes = myMelodies.reduce((sum, m) => sum + m.stats.likes, 0);
    const approvedCount = myMelodies.filter(m => m.flags.moderationStatus === 'approved').length;

    return {
      totalMelodies: myMelodies.length,
      approvedMelodies: approvedCount,
      totalPlays,
      totalSolves,
      totalLikes,
      averageSolveRate: totalPlays > 0 ? totalSolves / totalPlays : 0,
    };
  }, [state.myMelodies]);

  const getCreatorLeaderboard = useCallback((): {
    odId: string;
    odName: string;
    melodyCount: number;
    totalLikes: number;
    totalSolves: number;
  }[] => {
    const creators = new Map<string, {
      odId: string;
      odName: string;
      melodyCount: number;
      totalLikes: number;
      totalSolves: number;
    }>();

    state.publicPool.forEach(melody => {
      const existing = creators.get(melody.creatorId) || {
        odId: melody.creatorId,
        odName: melody.creatorName,
        melodyCount: 0,
        totalLikes: 0,
        totalSolves: 0,
      };
      
      creators.set(melody.creatorId, {
        ...existing,
        melodyCount: existing.melodyCount + 1,
        totalLikes: existing.totalLikes + melody.stats.likes,
        totalSolves: existing.totalSolves + melody.stats.solves,
      });
    });

    return Array.from(creators.values())
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 50);
  }, [state.publicPool]);

  return {
    myMelodies: state.myMelodies,
    publicPool: state.publicPool,
    challenges: state.challenges,
    isLoading: melodiesQuery.isLoading,
    currentDraft,
    setCurrentDraft,
    validateMelody,
    createMelody,
    updateMelody,
    deleteMelody,
    getMelodyByShareCode,
    getMelodyById,
    voteMelody,
    recordMelodySolve,
    createChallenge,
    submitChallengeResult,
    getPublicMelodies,
    creatorStats,
    getCreatorLeaderboard,
  };
});
