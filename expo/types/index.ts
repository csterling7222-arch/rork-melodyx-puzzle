export type FeedbackType = 'correct' | 'present' | 'absent' | 'empty';

export interface GuessResult {
  note: string;
  feedback: FeedbackType;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
  lastPlayedDate: string | null;
}

export interface DailyGameState {
  date: string;
  guesses: GuessResult[][];
  gameStatus: GameStatus;
  hintUsed: boolean;
  audioHintUsed: boolean;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export type MelodyDifficulty = 'easy' | 'medium' | 'hard' | 'epic' | 'legendary';

export interface MelodyLengthPreset {
  min: number;
  max: number;
  label: string;
}

export interface MelodyValidation {
  isValid: boolean;
  noteCount: number;
  uniqueNotes: number;
  hasValidNotes: boolean;
  errors: string[];
  warnings: string[];
  complexity: MelodyComplexity;
}

export type MelodyComplexity = 'simple' | 'moderate' | 'complex';

export interface Melody {
  name: string;
  notes: string[];
  extendedNotes: string[];
  hint: string;
  category: string;
  genre: string;
  era: string;
  mood: string;
  durations?: number[];
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isLooping: boolean;
  currentNoteIndex: number;
  totalNotes: number;
  progress: number;
  mode: PlaybackMode;
}

export type PlaybackMode = 'melody' | 'snippet' | 'hint' | 'teaser' | 'preview' | 'idle';

export interface PlaybackControls {
  pause: () => void;
  resume: () => void;
  toggleLoop: () => void;
  setSpeed: (speed: number) => void;
  replayFromStart: () => void;
}

export interface AudioSettings {
  volume: number;
  playbackSpeed: number;
  fadeIn: boolean;
  fadeOut: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  createdAt: string;
  achievements: string[];
  settings: UserSettings;
}

export interface UserSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  notificationsEnabled: boolean;
  theme: ThemeType;
  language: LanguageCode;
}

export type ThemeType = 'dark' | 'light' | 'system';

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'pt' | 'it' | 'ko' | 'zh' | 'ru';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  category: AchievementCategory;
  reward: AchievementReward;
}

export type AchievementCategory = 'gameplay' | 'streak' | 'social' | 'collection' | 'mastery';

export interface AchievementReward {
  xp: number;
  coins?: number;
  gems?: number;
  item?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  streak: number;
  lastPlayed: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  participants: number;
  prizes: TournamentPrize[];
  rules: TournamentRules;
}

export type TournamentStatus = 'upcoming' | 'active' | 'completed';

export interface TournamentPrize {
  rank: number;
  reward: AchievementReward;
}

export interface TournamentRules {
  maxAttempts: number;
  timeLimit?: number;
  melodyDifficulty: MelodyDifficulty;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  price: ItemPrice;
  icon: string;
  rarity: ItemRarity;
  unlockRequirement?: UnlockRequirement;
}

export type ShopItemType = 'theme' | 'instrument' | 'avatar' | 'powerup' | 'cosmetic';

export interface ItemPrice {
  coins?: number;
  gems?: number;
  realMoney?: number;
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface UnlockRequirement {
  type: 'level' | 'achievement' | 'purchase';
  value: string | number;
}

export interface NetworkMockConfig {
  enabled: boolean;
  latencyMs: number;
  failureRate: number;
}

export interface ErrorInfo {
  componentStack?: string;
}

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type ValidNote = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export const VALID_NOTES: readonly ValidNote[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export function isValidNote(note: string): note is ValidNote {
  return VALID_NOTES.includes(note as ValidNote);
}
