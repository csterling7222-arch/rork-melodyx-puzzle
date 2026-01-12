export const UGC_GENRES = [
  { id: 'pop', name: 'Pop', icon: '🎤', color: '#EC4899' },
  { id: 'rock', name: 'Rock', icon: '🎸', color: '#EF4444' },
  { id: 'classical', name: 'Classical', icon: '🎻', color: '#8B5CF6' },
  { id: 'jazz', name: 'Jazz', icon: '🎷', color: '#F59E0B' },
  { id: 'electronic', name: 'Electronic', icon: '🎧', color: '#06B6D4' },
  { id: 'folk', name: 'Folk', icon: '🪕', color: '#22C55E' },
  { id: 'game', name: 'Video Game', icon: '🎮', color: '#3B82F6' },
  { id: 'movie', name: 'Movie/TV', icon: '🎬', color: '#A855F7' },
  { id: 'meme', name: 'Meme', icon: '😂', color: '#FBBF24' },
  { id: 'original', name: 'Original', icon: '✨', color: '#10B981' },
] as const;

export const UGC_MOODS = [
  { id: 'happy', name: 'Happy', icon: '😊', color: '#FBBF24' },
  { id: 'sad', name: 'Sad', icon: '😢', color: '#3B82F6' },
  { id: 'energetic', name: 'Energetic', icon: '⚡', color: '#EF4444' },
  { id: 'chill', name: 'Chill', icon: '😌', color: '#06B6D4' },
  { id: 'epic', name: 'Epic', icon: '🏔️', color: '#8B5CF6' },
  { id: 'mysterious', name: 'Mysterious', icon: '🌙', color: '#6366F1' },
  { id: 'playful', name: 'Playful', icon: '🎪', color: '#EC4899' },
  { id: 'nostalgic', name: 'Nostalgic', icon: '📼', color: '#F97316' },
] as const;

export const UGC_DIFFICULTY = [
  { id: 'easy', name: 'Easy', noteRange: [5, 5], color: '#22C55E' },
  { id: 'medium', name: 'Medium', noteRange: [6, 6], color: '#F59E0B' },
  { id: 'hard', name: 'Hard', noteRange: [7, 8], color: '#EF4444' },
] as const;

export type UGCGenre = typeof UGC_GENRES[number]['id'];
export type UGCMood = typeof UGC_MOODS[number]['id'];
export type UGCDifficulty = typeof UGC_DIFFICULTY[number]['id'];

export interface UserMelody {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  notes: string[];
  hint: string;
  genre: UGCGenre;
  mood: UGCMood;
  difficulty: UGCDifficulty;
  createdAt: string;
  updatedAt: string;
  shareCode: string;
  isPublic: boolean;
  stats: {
    plays: number;
    solves: number;
    likes: number;
    dislikes: number;
    averageGuesses: number;
  };
  flags: {
    isDuplicate: boolean;
    isOffensive: boolean;
    isLowQuality: boolean;
    moderationStatus: 'pending' | 'approved' | 'rejected';
  };
}

export interface MelodyChallenge {
  id: string;
  melodyId: string;
  challengerId: string;
  challengerName: string;
  challengedIds: string[];
  createdAt: string;
  expiresAt: string;
  results: {
    odId: string
    odName: string;
    guesses: number;
    timeMs: number;
    won: boolean;
    completedAt: string;
  }[];
}

export const MIN_NOTES = 5;
export const MAX_NOTES = 8;
export const MAX_TITLE_LENGTH = 40;
export const MAX_HINT_LENGTH = 100;

export const SHARE_CODE_LENGTH = 8;

export function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getMelodyShareUrl(shareCode: string): string {
  return `melodyx://challenge/${shareCode}`;
}

export const CREATOR_REWARDS = {
  melodyCreated: 10,
  melodyApproved: 25,
  melodySolved: 2,
  melodyLiked: 1,
  melodyFeatured: 100,
  challengeWon: 15,
} as const;

export const CREATOR_MILESTONES = [
  { count: 1, title: 'First Composition', reward: 50 },
  { count: 5, title: 'Budding Composer', reward: 100 },
  { count: 10, title: 'Melody Maker', reward: 200 },
  { count: 25, title: 'Prolific Creator', reward: 500 },
  { count: 50, title: 'Master Composer', reward: 1000 },
  { count: 100, title: 'Legendary Artist', reward: 2500 },
] as const;
