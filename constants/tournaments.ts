export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  type: 'fever' | 'duel' | 'accuracy' | 'speed';
  entryTokens: number;
  prizePool: TournamentPrize[];
  status: 'upcoming' | 'active' | 'completed';
  maxParticipants: number;
  currentParticipants: number;
}

export interface TournamentPrize {
  rank: number | string;
  reward: string;
  icon: string;
  badge?: string;
}

export interface TournamentMatch {
  id: string;
  round: number;
  player1: TournamentPlayer;
  player2: TournamentPlayer | null;
  winnerId?: string;
  status: 'pending' | 'in_progress' | 'completed';
  scores?: { player1: number; player2: number };
}

export interface TournamentPlayer {
  id: string;
  name: string;
  avatar?: string;
  seed?: number;
  score?: number;
  eliminated?: boolean;
}

export interface TournamentBracket {
  tournamentId: string;
  rounds: TournamentMatch[][];
  finalWinner?: TournamentPlayer;
}

export const SAMPLE_TOURNAMENTS: Tournament[] = [
  {
    id: 'fever_championship_2026',
    name: 'Fever Championship',
    description: 'Ultimate Fever mode showdown! Chain melodies for maximum points.',
    startDate: '2026-01-13',
    endDate: '2026-01-19',
    type: 'fever',
    entryTokens: 1,
    prizePool: [
      { rank: 1, reward: '🏆 Champion Badge + 1000 Coins', icon: '🥇', badge: 'fever_champion' },
      { rank: 2, reward: '🥈 500 Coins + Exclusive Skin', icon: '🥈' },
      { rank: 3, reward: '🥉 250 Coins', icon: '🥉' },
      { rank: '4-10', reward: '100 Coins', icon: '🎖️' },
    ],
    status: 'active',
    maxParticipants: 64,
    currentParticipants: 48,
  },
  {
    id: 'speed_masters_jan',
    name: 'Speed Masters',
    description: 'Fastest fingers win! Solve puzzles in record time.',
    startDate: '2026-01-20',
    endDate: '2026-01-26',
    type: 'speed',
    entryTokens: 1,
    prizePool: [
      { rank: 1, reward: '⚡ Speed Demon Badge + 800 Coins', icon: '🥇', badge: 'speed_demon' },
      { rank: 2, reward: '400 Coins', icon: '🥈' },
      { rank: 3, reward: '200 Coins', icon: '🥉' },
    ],
    status: 'upcoming',
    maxParticipants: 128,
    currentParticipants: 0,
  },
  {
    id: 'duel_royale_jan',
    name: 'Duel Royale',
    description: 'Head-to-head elimination bracket. Only one survives!',
    startDate: '2026-01-06',
    endDate: '2026-01-12',
    type: 'duel',
    entryTokens: 2,
    prizePool: [
      { rank: 1, reward: '👑 Royale Crown + 1500 Coins', icon: '🥇', badge: 'duel_royale' },
      { rank: 2, reward: '750 Coins + Rare Skin', icon: '🥈' },
      { rank: 3, reward: '375 Coins', icon: '🥉' },
      { rank: 4, reward: '200 Coins', icon: '🎖️' },
    ],
    status: 'completed',
    maxParticipants: 32,
    currentParticipants: 32,
  },
  {
    id: 'accuracy_elite',
    name: 'Accuracy Elite',
    description: 'Precision is key! Fewest guesses win.',
    startDate: '2026-01-27',
    endDate: '2026-02-02',
    type: 'accuracy',
    entryTokens: 1,
    prizePool: [
      { rank: 1, reward: '🎯 Sharpshooter Badge + 600 Coins', icon: '🥇', badge: 'sharpshooter' },
      { rank: 2, reward: '300 Coins', icon: '🥈' },
      { rank: 3, reward: '150 Coins', icon: '🥉' },
    ],
    status: 'upcoming',
    maxParticipants: 256,
    currentParticipants: 0,
  },
  {
    id: 'weekly_fever_1',
    name: 'Weekly Fever Rush',
    description: 'Weekly Fever competition - top scorers get rewards!',
    startDate: '2026-01-08',
    endDate: '2026-01-14',
    type: 'fever',
    entryTokens: 0,
    prizePool: [
      { rank: 1, reward: '500 Coins', icon: '🥇' },
      { rank: 2, reward: '250 Coins', icon: '🥈' },
      { rank: 3, reward: '100 Coins', icon: '🥉' },
    ],
    status: 'active',
    maxParticipants: 1000,
    currentParticipants: 342,
  },
];

export const SAMPLE_BRACKETS: TournamentBracket[] = [
  {
    tournamentId: 'duel_royale_jan',
    rounds: [
      [
        { id: 'm1', round: 1, player1: { id: 'p1', name: 'MelodyKing', seed: 1 }, player2: { id: 'p2', name: 'BeatMaster', seed: 32 }, winnerId: 'p1', status: 'completed', scores: { player1: 3, player2: 1 } },
        { id: 'm2', round: 1, player1: { id: 'p3', name: 'NoteNinja', seed: 16 }, player2: { id: 'p4', name: 'HarmonyHero', seed: 17 }, winnerId: 'p3', status: 'completed', scores: { player1: 3, player2: 2 } },
        { id: 'm3', round: 1, player1: { id: 'p5', name: 'RhythmRider', seed: 8 }, player2: { id: 'p6', name: 'TuneChaser', seed: 25 }, winnerId: 'p5', status: 'completed', scores: { player1: 3, player2: 0 } },
        { id: 'm4', round: 1, player1: { id: 'p7', name: 'SoundWave', seed: 9 }, player2: { id: 'p8', name: 'MusicMaven', seed: 24 }, winnerId: 'p7', status: 'completed', scores: { player1: 3, player2: 1 } },
      ],
      [
        { id: 'm5', round: 2, player1: { id: 'p1', name: 'MelodyKing', seed: 1 }, player2: { id: 'p3', name: 'NoteNinja', seed: 16 }, winnerId: 'p1', status: 'completed', scores: { player1: 3, player2: 2 } },
        { id: 'm6', round: 2, player1: { id: 'p5', name: 'RhythmRider', seed: 8 }, player2: { id: 'p7', name: 'SoundWave', seed: 9 }, winnerId: 'p5', status: 'completed', scores: { player1: 3, player2: 1 } },
      ],
      [
        { id: 'm7', round: 3, player1: { id: 'p1', name: 'MelodyKing', seed: 1 }, player2: { id: 'p5', name: 'RhythmRider', seed: 8 }, winnerId: 'p1', status: 'completed', scores: { player1: 3, player2: 2 } },
      ],
    ],
    finalWinner: { id: 'p1', name: 'MelodyKing', seed: 1 },
  },
];

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  gamesPlayed: number;
  avatar?: string;
}

export const TOURNAMENT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, playerId: 'p1', playerName: 'MelodyKing', score: 15420, gamesPlayed: 12 },
  { rank: 2, playerId: 'p5', playerName: 'RhythmRider', score: 14850, gamesPlayed: 14 },
  { rank: 3, playerId: 'p3', playerName: 'NoteNinja', score: 13200, gamesPlayed: 11 },
  { rank: 4, playerId: 'p7', playerName: 'SoundWave', score: 12100, gamesPlayed: 15 },
  { rank: 5, playerId: 'p9', playerName: 'BeatBoss', score: 11500, gamesPlayed: 10 },
  { rank: 6, playerId: 'p10', playerName: 'TuneTracker', score: 10800, gamesPlayed: 13 },
  { rank: 7, playerId: 'p11', playerName: 'HarmonyHunter', score: 9950, gamesPlayed: 9 },
  { rank: 8, playerId: 'p12', playerName: 'PitchPerfect', score: 9200, gamesPlayed: 11 },
];
