import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { 
  Tournament, 
  TournamentBracket, 
  LeaderboardEntry,
  SAMPLE_TOURNAMENTS, 
  SAMPLE_BRACKETS,
  TOURNAMENT_LEADERBOARD 
} from '@/constants/tournaments';

export interface PlayerTournamentStats {
  participatedTournaments: string[];
  wonTournaments: string[];
  totalWins: number;
  totalMatches: number;
  tokens: number;
  lastDailyTokenClaim: string | null;
  earnedBadges: string[];
  currentTournamentId: string | null;
}

const STORAGE_KEYS = {
  TOURNAMENT_STATS: 'melodyx_tournament_stats',
};

const DEFAULT_STATS: PlayerTournamentStats = {
  participatedTournaments: [],
  wonTournaments: [],
  totalWins: 0,
  totalMatches: 0,
  tokens: 3,
  lastDailyTokenClaim: null,
  earnedBadges: [],
  currentTournamentId: null,
};

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

export const [TournamentProvider, useTournament] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showBracket, setShowBracket] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const statsQuery = useQuery({
    queryKey: ['tournamentStats'],
    queryFn: async (): Promise<PlayerTournamentStats> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOURNAMENT_STATS);
      if (stored) {
        return JSON.parse(stored);
      }
      return DEFAULT_STATS;
    },
  });

  const { mutate: saveStats } = useMutation({
    mutationFn: async (stats: PlayerTournamentStats) => {
      await AsyncStorage.setItem(STORAGE_KEYS.TOURNAMENT_STATS, JSON.stringify(stats));
      return stats;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournamentStats'] });
    },
  });

  const stats = statsQuery.data ?? DEFAULT_STATS;

  const tournaments = useMemo(() => {
    return SAMPLE_TOURNAMENTS.map(t => ({
      ...t,
      isJoined: stats.participatedTournaments.includes(t.id),
    }));
  }, [stats.participatedTournaments]);

  const activeTournaments = useMemo(() => {
    return tournaments.filter(t => t.status === 'active');
  }, [tournaments]);

  const upcomingTournaments = useMemo(() => {
    return tournaments.filter(t => t.status === 'upcoming');
  }, [tournaments]);

  const completedTournaments = useMemo(() => {
    return tournaments.filter(t => t.status === 'completed');
  }, [tournaments]);

  const canClaimDailyToken = useMemo(() => {
    return stats.lastDailyTokenClaim !== getTodayString();
  }, [stats.lastDailyTokenClaim]);

  const claimDailyToken = useCallback(() => {
    if (!canClaimDailyToken) return false;

    const newStats: PlayerTournamentStats = {
      ...stats,
      tokens: stats.tokens + 1,
      lastDailyTokenClaim: getTodayString(),
    };

    saveStats(newStats);
    return true;
  }, [canClaimDailyToken, stats, saveStats]);

  const joinTournament = useCallback((tournament: Tournament) => {
    if (stats.tokens < tournament.entryTokens) {
      console.log('Not enough tokens');
      return false;
    }

    if (stats.participatedTournaments.includes(tournament.id)) {
      console.log('Already joined');
      return false;
    }

    const newStats: PlayerTournamentStats = {
      ...stats,
      tokens: stats.tokens - tournament.entryTokens,
      participatedTournaments: [...stats.participatedTournaments, tournament.id],
      currentTournamentId: tournament.id,
    };

    saveStats(newStats);
    setShowJoinModal(false);
    return true;
  }, [stats, saveStats]);

  const getBracket = useCallback((tournamentId: string): TournamentBracket | null => {
    return SAMPLE_BRACKETS.find(b => b.tournamentId === tournamentId) ?? null;
  }, []);

  const getLeaderboard = useCallback((tournamentId: string): LeaderboardEntry[] => {
    return TOURNAMENT_LEADERBOARD;
  }, []);

  const recordMatchResult = useCallback((won: boolean) => {
    const newStats: PlayerTournamentStats = {
      ...stats,
      totalMatches: stats.totalMatches + 1,
      totalWins: stats.totalWins + (won ? 1 : 0),
    };

    saveStats(newStats);
  }, [stats, saveStats]);

  const purchaseTokens = useCallback((amount: number) => {
    const newStats: PlayerTournamentStats = {
      ...stats,
      tokens: stats.tokens + amount,
    };

    saveStats(newStats);
  }, [stats, saveStats]);

  const getTournamentStatus = useCallback((tournament: Tournament): string => {
    const now = new Date();
    const start = new Date(tournament.startDate);
    const end = new Date(tournament.endDate);

    if (now < start) {
      const days = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    }

    if (now > end) {
      return 'Completed';
    }

    const remaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${remaining} day${remaining > 1 ? 's' : ''} left`;
  }, []);

  return {
    stats,
    tournaments,
    activeTournaments,
    upcomingTournaments,
    completedTournaments,
    selectedTournament,
    setSelectedTournament,
    showBracket,
    setShowBracket,
    showJoinModal,
    setShowJoinModal,
    isLoading: statsQuery.isLoading,
    canClaimDailyToken,
    claimDailyToken,
    joinTournament,
    getBracket,
    getLeaderboard,
    recordMatchResult,
    purchaseTokens,
    getTournamentStatus,
  };
});
