import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { THEMED_EVENTS, getActiveEvent, getUpcomingEvents } from '@/constants/events';
import { Melody } from '@/utils/melodies';
import { getFeedback, isWin, GuessResult } from '@/utils/gameLogic';

export interface EventProgress {
  eventId: string;
  puzzlesCompleted: number;
  puzzleResults: { melodyName: string; guesses: number; won: boolean }[];
  rewardsClaimed: string[];
  startedAt: string;
  completedAt: string | null;
}

interface EventsState {
  eventProgress: EventProgress[];
  currentEventPuzzleIndex: number;
}

const STORAGE_KEY = 'melodyx_events';

const DEFAULT_STATE: EventsState = {
  eventProgress: [],
  currentEventPuzzleIndex: 0,
};

export const [EventsProvider, useEvents] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<GuessResult[][]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const eventsQuery = useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<EventsState> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_STATE;
    },
  });

  const { mutate: saveEvents } = useMutation({
    mutationFn: async (state: EventsState) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const eventsState = eventsQuery.data ?? DEFAULT_STATE;

  const activeEvent = useMemo(() => getActiveEvent(), []);
  const upcomingEvents = useMemo(() => getUpcomingEvents(3), []);

  const currentEventProgress = useMemo(() => {
    if (!activeEvent) return null;
    return eventsState.eventProgress.find(p => p.eventId === activeEvent.id) || null;
  }, [activeEvent, eventsState.eventProgress]);

  const currentPuzzle = useMemo((): Melody | null => {
    if (!activeEvent) return null;
    const progress = currentEventProgress;
    const puzzleIndex = progress?.puzzlesCompleted ?? 0;
    if (puzzleIndex >= activeEvent.songs.length) return null;
    return activeEvent.songs[puzzleIndex];
  }, [activeEvent, currentEventProgress]);

  const startEvent = useCallback((eventId: string) => {
    const existingProgress = eventsState.eventProgress.find(p => p.eventId === eventId);
    if (existingProgress) return;

    const newProgress: EventProgress = {
      eventId,
      puzzlesCompleted: 0,
      puzzleResults: [],
      rewardsClaimed: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    const newState: EventsState = {
      ...eventsState,
      eventProgress: [...eventsState.eventProgress, newProgress],
      currentEventPuzzleIndex: 0,
    };

    saveEvents(newState);
    setGuesses([]);
    setCurrentGuess([]);
    setGameStatus('playing');
  }, [eventsState, saveEvents]);

  const addNote = useCallback((note: string) => {
    if (gameStatus !== 'playing' || !currentPuzzle) return;
    setCurrentGuess(prev => {
      if (prev.length >= currentPuzzle.notes.length) return prev;
      return [...prev, note];
    });
  }, [gameStatus, currentPuzzle]);

  const removeNote = useCallback(() => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [gameStatus]);

  const submitGuess = useCallback(() => {
    if (!currentPuzzle || !activeEvent) return;
    if (currentGuess.length !== currentPuzzle.notes.length || gameStatus !== 'playing') return;

    const feedback = getFeedback(currentGuess, currentPuzzle.notes);
    const won = isWin(feedback);
    const newGuesses = [...guesses, feedback];
    const lost = newGuesses.length >= 6 && !won;

    setGuesses(newGuesses);
    setCurrentGuess([]);

    if (won || lost) {
      setGameStatus(won ? 'won' : 'lost');

      const progress = currentEventProgress || {
        eventId: activeEvent.id,
        puzzlesCompleted: 0,
        puzzleResults: [],
        rewardsClaimed: [],
        startedAt: new Date().toISOString(),
        completedAt: null,
      };

      const newPuzzleResult = {
        melodyName: currentPuzzle.name,
        guesses: newGuesses.length,
        won,
      };

      const updatedProgress: EventProgress = {
        ...progress,
        puzzlesCompleted: progress.puzzlesCompleted + 1,
        puzzleResults: [...progress.puzzleResults, newPuzzleResult],
        completedAt: progress.puzzlesCompleted + 1 >= activeEvent.songs.length
          ? new Date().toISOString()
          : null,
      };

      const newState: EventsState = {
        ...eventsState,
        eventProgress: eventsState.eventProgress.some(p => p.eventId === activeEvent.id)
          ? eventsState.eventProgress.map(p =>
              p.eventId === activeEvent.id ? updatedProgress : p
            )
          : [...eventsState.eventProgress, updatedProgress],
      };

      saveEvents(newState);
    }
  }, [currentGuess, currentPuzzle, activeEvent, guesses, gameStatus, currentEventProgress, eventsState, saveEvents]);

  const nextPuzzle = useCallback(() => {
    setGuesses([]);
    setCurrentGuess([]);
    setGameStatus('playing');
  }, []);

  const claimReward = useCallback((rewardId: string) => {
    if (!activeEvent || !currentEventProgress) return false;
    if (currentEventProgress.rewardsClaimed.includes(rewardId)) return false;

    const updatedProgress: EventProgress = {
      ...currentEventProgress,
      rewardsClaimed: [...currentEventProgress.rewardsClaimed, rewardId],
    };

    const newState: EventsState = {
      ...eventsState,
      eventProgress: eventsState.eventProgress.map(p =>
        p.eventId === activeEvent.id ? updatedProgress : p
      ),
    };

    saveEvents(newState);
    return true;
  }, [activeEvent, currentEventProgress, eventsState, saveEvents]);

  const getEventProgress = useCallback((eventId: string): EventProgress | null => {
    return eventsState.eventProgress.find(p => p.eventId === eventId) || null;
  }, [eventsState.eventProgress]);

  return {
    activeEvent,
    upcomingEvents,
    allEvents: THEMED_EVENTS,
    currentEventProgress,
    currentPuzzle,
    currentGuess,
    guesses,
    gameStatus,
    isLoading: eventsQuery.isLoading,
    startEvent,
    addNote,
    removeNote,
    submitGuess,
    nextPuzzle,
    claimReward,
    getEventProgress,
  };
});
