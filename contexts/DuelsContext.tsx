import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { MELODIES, Melody, seededRandom } from '@/utils/melodies';

export interface Duel {
  id: string;
  melody: Melody;
  player1: DuelPlayer;
  player2: DuelPlayer | null;
  status: 'waiting' | 'active' | 'completed';
  mode: 'race' | 'async' | 'duet';
  createdAt: string;
  completedAt: string | null;
  winnerId: string | null;
}

export interface DuelPlayer {
  id: string;
  username: string;
  guesses: number;
  timeMs: number;
  completed: boolean;
  won: boolean;
}

export interface DuelInvite {
  id: string;
  fromUsername: string;
  fromId: string;
  mode: Duel['mode'];
  createdAt: string;
}

const STORAGE_KEY = 'melodyx_duels';

interface DuelsState {
  activeDuels: Duel[];
  completedDuels: Duel[];
  pendingInvites: DuelInvite[];
}

const DEFAULT_STATE: DuelsState = {
  activeDuels: [],
  completedDuels: [],
  pendingInvites: [],
};

function generateDuelId(): string {
  return `duel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getRandomMelody(): Melody {
  const seed = Date.now();
  const index = Math.floor(seededRandom(seed) * MELODIES.length);
  return MELODIES[index];
}

const MOCK_PLAYERS = [
  { id: 'bot_1', username: 'MelodyBot' },
  { id: 'bot_2', username: 'NoteNinja' },
  { id: 'bot_3', username: 'TuneHunter' },
  { id: 'bot_4', username: 'RhythmKing' },
  { id: 'bot_5', username: 'SoundWizard' },
];

export const [DuelsProvider, useDuels] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentDuel, setCurrentDuel] = useState<Duel | null>(null);

  const duelsQuery = useQuery({
    queryKey: ['duels'],
    queryFn: async (): Promise<DuelsState> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.log('Error loading duels:', error);
      }
      return DEFAULT_STATE;
    },
  });

  const { mutate: saveDuels } = useMutation({
    mutationFn: async (state: DuelsState) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['duels'] });
    },
  });

  const duelsState = duelsQuery.data ?? DEFAULT_STATE;

  const createDuel = useCallback((
    userId: string,
    username: string,
    mode: Duel['mode']
  ): Duel => {
    const duel: Duel = {
      id: generateDuelId(),
      melody: getRandomMelody(),
      player1: {
        id: userId,
        username,
        guesses: 0,
        timeMs: 0,
        completed: false,
        won: false,
      },
      player2: null,
      status: 'waiting',
      mode,
      createdAt: new Date().toISOString(),
      completedAt: null,
      winnerId: null,
    };

    const newState: DuelsState = {
      ...duelsState,
      activeDuels: [...duelsState.activeDuels, duel],
    };

    saveDuels(newState);
    setCurrentDuel(duel);
    return duel;
  }, [duelsState, saveDuels]);

  const joinDuel = useCallback((
    duelId: string,
    userId: string,
    username: string
  ): Duel | null => {
    const duel = duelsState.activeDuels.find(d => d.id === duelId);
    if (!duel || duel.status !== 'waiting') return null;

    const updatedDuel: Duel = {
      ...duel,
      player2: {
        id: userId,
        username,
        guesses: 0,
        timeMs: 0,
        completed: false,
        won: false,
      },
      status: 'active',
    };

    const newState: DuelsState = {
      ...duelsState,
      activeDuels: duelsState.activeDuels.map(d => 
        d.id === duelId ? updatedDuel : d
      ),
    };

    saveDuels(newState);
    setCurrentDuel(updatedDuel);
    return updatedDuel;
  }, [duelsState, saveDuels]);

  const quickMatch = useCallback((
    userId: string,
    username: string,
    mode: Duel['mode']
  ): Duel => {
    const opponent = MOCK_PLAYERS[Math.floor(Math.random() * MOCK_PLAYERS.length)];
    
    const duel: Duel = {
      id: generateDuelId(),
      melody: getRandomMelody(),
      player1: {
        id: userId,
        username,
        guesses: 0,
        timeMs: 0,
        completed: false,
        won: false,
      },
      player2: {
        id: opponent.id,
        username: opponent.username,
        guesses: 0,
        timeMs: 0,
        completed: false,
        won: false,
      },
      status: 'active',
      mode,
      createdAt: new Date().toISOString(),
      completedAt: null,
      winnerId: null,
    };

    const newState: DuelsState = {
      ...duelsState,
      activeDuels: [...duelsState.activeDuels, duel],
    };

    saveDuels(newState);
    setCurrentDuel(duel);
    return duel;
  }, [duelsState, saveDuels]);

  const submitDuelResult = useCallback((
    duelId: string,
    playerId: string,
    guesses: number,
    timeMs: number,
    won: boolean
  ) => {
    const duel = duelsState.activeDuels.find(d => d.id === duelId);
    if (!duel) return;

    const isPlayer1 = duel.player1.id === playerId;
    const updatedPlayer: DuelPlayer = {
      ...(isPlayer1 ? duel.player1 : duel.player2!),
      guesses,
      timeMs,
      completed: true,
      won,
    };

    let updatedDuel: Duel = {
      ...duel,
      player1: isPlayer1 ? updatedPlayer : duel.player1,
      player2: isPlayer1 ? duel.player2 : updatedPlayer,
    };

    const botPlayer = updatedDuel.player2?.id.startsWith('bot_') ? updatedDuel.player2 : null;
    if (botPlayer && !botPlayer.completed) {
      const botGuesses = Math.floor(Math.random() * 4) + 2;
      const botTime = Math.floor(Math.random() * 30000) + 10000;
      const botWon = botGuesses <= 6;
      
      updatedDuel = {
        ...updatedDuel,
        player2: {
          ...botPlayer,
          guesses: botGuesses,
          timeMs: botTime,
          completed: true,
          won: botWon,
        },
      };
    }

    const p1 = updatedDuel.player1;
    const p2 = updatedDuel.player2;
    
    if (p1.completed && p2?.completed) {
      let winnerId: string | null = null;
      
      if (p1.won && !p2.won) {
        winnerId = p1.id;
      } else if (!p1.won && p2.won) {
        winnerId = p2.id;
      } else if (p1.won && p2.won) {
        if (p1.guesses < p2.guesses) {
          winnerId = p1.id;
        } else if (p2.guesses < p1.guesses) {
          winnerId = p2.id;
        } else {
          winnerId = p1.timeMs < p2.timeMs ? p1.id : p2.id;
        }
      }

      updatedDuel = {
        ...updatedDuel,
        status: 'completed',
        completedAt: new Date().toISOString(),
        winnerId,
      };

      const newState: DuelsState = {
        ...duelsState,
        activeDuels: duelsState.activeDuels.filter(d => d.id !== duelId),
        completedDuels: [...duelsState.completedDuels, updatedDuel],
      };

      saveDuels(newState);
    } else {
      const newState: DuelsState = {
        ...duelsState,
        activeDuels: duelsState.activeDuels.map(d =>
          d.id === duelId ? updatedDuel : d
        ),
      };

      saveDuels(newState);
    }

    setCurrentDuel(updatedDuel);
  }, [duelsState, saveDuels]);

  const getDuelStats = useMemo(() => {
    const completed = duelsState.completedDuels;
    return {
      total: completed.length,
      wins: completed.filter(d => d.winnerId && !d.winnerId.startsWith('bot_')).length,
      losses: completed.filter(d => d.winnerId?.startsWith('bot_')).length,
    };
  }, [duelsState.completedDuels]);

  return {
    activeDuels: duelsState.activeDuels,
    completedDuels: duelsState.completedDuels,
    pendingInvites: duelsState.pendingInvites,
    currentDuel,
    isLoading: duelsQuery.isLoading,
    stats: getDuelStats,
    createDuel,
    joinDuel,
    quickMatch,
    submitDuelResult,
    setCurrentDuel,
  };
});
