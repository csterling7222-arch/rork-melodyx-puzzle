export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'skin' | 'hint_pack' | 'coins' | 'premium';
  price: number;
  currency: 'coins' | 'usd';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
}

export interface KeyboardSkin {
  id: string;
  name: string;
  icon: string;
  colors: Record<string, string>;
  textColors: Record<string, string>;
  preview: string;
}

export const KEYBOARD_SKINS: KeyboardSkin[] = [
  {
    id: 'default',
    name: 'Classic',
    icon: '🎹',
    colors: {
      C: '#EF4444', 'C#': '#1F1F1F',
      D: '#F97316', 'D#': '#1F1F1F',
      E: '#EAB308', F: '#22C55E',
      'F#': '#1F1F1F', G: '#06B6D4',
      'G#': '#1F1F1F', A: '#3B82F6',
      'A#': '#1F1F1F', B: '#A855F7',
    },
    textColors: {
      C: '#FFFFFF', 'C#': '#FFFFFF',
      D: '#FFFFFF', 'D#': '#FFFFFF',
      E: '#1F1F1F', F: '#FFFFFF',
      'F#': '#FFFFFF', G: '#1F1F1F',
      'G#': '#FFFFFF', A: '#FFFFFF',
      'A#': '#FFFFFF', B: '#FFFFFF',
    },
    preview: 'Rainbow gradient',
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    icon: '💜',
    colors: {
      C: '#FF00FF', 'C#': '#1A0A1A',
      D: '#FF00AA', 'D#': '#1A0A1A',
      E: '#FF0066', F: '#FF3300',
      'F#': '#1A0A1A', G: '#FF6600',
      'G#': '#1A0A1A', A: '#FFCC00',
      'A#': '#1A0A1A', B: '#00FFFF',
    },
    textColors: {
      C: '#FFFFFF', 'C#': '#FF00FF',
      D: '#FFFFFF', 'D#': '#FF00AA',
      E: '#FFFFFF', F: '#FFFFFF',
      'F#': '#FF3300', G: '#000000',
      'G#': '#FF6600', A: '#000000',
      'A#': '#FFCC00', B: '#000000',
    },
    preview: 'Vibrant neon colors',
  },
  {
    id: 'ocean',
    name: 'Ocean Wave',
    icon: '🌊',
    colors: {
      C: '#0077B6', 'C#': '#03045E',
      D: '#0096C7', 'D#': '#03045E',
      E: '#00B4D8', F: '#48CAE4',
      'F#': '#03045E', G: '#90E0EF',
      'G#': '#03045E', A: '#ADE8F4',
      'A#': '#03045E', B: '#CAF0F8',
    },
    textColors: {
      C: '#FFFFFF', 'C#': '#48CAE4',
      D: '#FFFFFF', 'D#': '#48CAE4',
      E: '#000000', F: '#000000',
      'F#': '#48CAE4', G: '#000000',
      'G#': '#48CAE4', A: '#000000',
      'A#': '#48CAE4', B: '#000000',
    },
    preview: 'Cool ocean blues',
  },
  {
    id: 'sunset',
    name: 'Sunset Blaze',
    icon: '🌅',
    colors: {
      C: '#FF6B6B', 'C#': '#2D1B1B',
      D: '#FF8E72', 'D#': '#2D1B1B',
      E: '#FFA07A', F: '#FFB347',
      'F#': '#2D1B1B', G: '#FFC857',
      'G#': '#2D1B1B', A: '#FFDA77',
      'A#': '#2D1B1B', B: '#FFE4B5',
    },
    textColors: {
      C: '#FFFFFF', 'C#': '#FF8E72',
      D: '#000000', 'D#': '#FF8E72',
      E: '#000000', F: '#000000',
      'F#': '#FFB347', G: '#000000',
      'G#': '#FFC857', A: '#000000',
      'A#': '#FFDA77', B: '#000000',
    },
    preview: 'Warm sunset tones',
  },
  {
    id: 'midnight',
    name: 'Midnight Galaxy',
    icon: '🌌',
    colors: {
      C: '#4A0E4E', 'C#': '#0D0D1A',
      D: '#5C1365', 'D#': '#0D0D1A',
      E: '#6B1D7C', F: '#7B2791',
      'F#': '#0D0D1A', G: '#8B31A6',
      'G#': '#0D0D1A', A: '#9B3BBB',
      'A#': '#0D0D1A', B: '#AB45D0',
    },
    textColors: {
      C: '#FFFFFF', 'C#': '#8B31A6',
      D: '#FFFFFF', 'D#': '#8B31A6',
      E: '#FFFFFF', F: '#FFFFFF',
      'F#': '#8B31A6', G: '#FFFFFF',
      'G#': '#8B31A6', A: '#FFFFFF',
      'A#': '#8B31A6', B: '#FFFFFF',
    },
    preview: 'Deep purple cosmos',
  },
];

export const SHOP_ITEMS: ShopItem[] = [
  // Skins
  {
    id: 'skin_neon',
    name: 'Neon Glow Keyboard',
    description: 'Vibrant neon colors for your piano',
    icon: '💜',
    type: 'skin',
    price: 500,
    currency: 'coins',
    rarity: 'rare',
    color: '#FF00FF',
  },
  {
    id: 'skin_ocean',
    name: 'Ocean Wave Keyboard',
    description: 'Cool ocean blues',
    icon: '🌊',
    type: 'skin',
    price: 500,
    currency: 'coins',
    rarity: 'rare',
    color: '#00B4D8',
  },
  {
    id: 'skin_sunset',
    name: 'Sunset Blaze Keyboard',
    description: 'Warm sunset tones',
    icon: '🌅',
    type: 'skin',
    price: 750,
    currency: 'coins',
    rarity: 'epic',
    color: '#FF8E72',
  },
  {
    id: 'skin_midnight',
    name: 'Midnight Galaxy Keyboard',
    description: 'Deep purple cosmos',
    icon: '🌌',
    type: 'skin',
    price: 1000,
    currency: 'coins',
    rarity: 'legendary',
    color: '#8B31A6',
  },
  
  // Hint packs
  {
    id: 'hints_5',
    name: '5 Hint Pack',
    description: 'Get 5 extra hints',
    icon: '💡',
    type: 'hint_pack',
    price: 100,
    currency: 'coins',
    rarity: 'common',
    color: '#EAB308',
  },
  {
    id: 'hints_15',
    name: '15 Hint Pack',
    description: 'Get 15 extra hints (save 20%)',
    icon: '💡',
    type: 'hint_pack',
    price: 240,
    currency: 'coins',
    rarity: 'common',
    color: '#EAB308',
  },
  {
    id: 'hints_50',
    name: '50 Hint Pack',
    description: 'Get 50 extra hints (save 40%)',
    icon: '🌟',
    type: 'hint_pack',
    price: 600,
    currency: 'coins',
    rarity: 'rare',
    color: '#FFD700',
  },

  // Coin packs (real money)
  {
    id: 'coins_500',
    name: '500 Coins',
    description: 'Starter coin pack',
    icon: '💰',
    type: 'coins',
    price: 0.99,
    currency: 'usd',
    rarity: 'common',
    color: '#FFD700',
  },
  {
    id: 'coins_1500',
    name: '1500 Coins',
    description: 'Value coin pack (+20% bonus)',
    icon: '💰',
    type: 'coins',
    price: 2.99,
    currency: 'usd',
    rarity: 'rare',
    color: '#FFD700',
  },
  {
    id: 'coins_5000',
    name: '5000 Coins',
    description: 'Premium coin pack (+50% bonus)',
    icon: '💎',
    type: 'coins',
    price: 7.99,
    currency: 'usd',
    rarity: 'epic',
    color: '#00CED1',
  },

  // Premium subscription
  {
    id: 'premium_monthly',
    name: 'Melodyx Premium',
    description: 'Ad-free, unlimited practice, exclusive skins',
    icon: '👑',
    type: 'premium',
    price: 4.99,
    currency: 'usd',
    rarity: 'legendary',
    color: '#FFD700',
  },
];

export type PowerUpType = 'skip_note' | 'reveal_note' | 'extra_guess' | 'audio_hint' | 'slow_motion' | 'double_xp';

export interface DailyRewardItem {
  day: number;
  coins: number;
  hints?: number;
  powerUp?: PowerUpType;
  powerUpCount?: number;
  bonus?: 'free_hint' | 'double_coins' | 'premium_trial' | 'mystery_box';
  icon: string;
  description: string;
}

export const DAILY_REWARDS: DailyRewardItem[] = [
  { day: 1, coins: 25, icon: '🎵', description: 'Welcome back!' },
  { day: 2, coins: 50, powerUp: 'audio_hint', powerUpCount: 1, icon: '🎶', description: 'Audio hint unlocked!' },
  { day: 3, coins: 75, hints: 1, icon: '🎸', description: '+1 Hint bonus!' },
  { day: 4, coins: 100, powerUp: 'reveal_note', powerUpCount: 1, icon: '🎹', description: 'Reveal power-up!' },
  { day: 5, coins: 150, hints: 2, powerUp: 'extra_guess', powerUpCount: 1, icon: '🎺', description: '+2 Hints & Extra Guess!' },
  { day: 6, coins: 200, powerUp: 'double_xp', powerUpCount: 1, icon: '🎻', description: 'Double XP active!' },
  { day: 7, coins: 500, hints: 3, bonus: 'mystery_box', icon: '🏆', description: 'Weekly champion + Mystery Box!' },
];

export const POWER_UP_INFO: Record<PowerUpType, { name: string; icon: string; description: string }> = {
  skip_note: { name: 'Skip Note', icon: '⏭️', description: 'Skip one note in your guess' },
  reveal_note: { name: 'Reveal Note', icon: '👁️', description: 'Reveal one correct note position' },
  extra_guess: { name: 'Extra Guess', icon: '➕', description: 'Get one additional guess attempt' },
  audio_hint: { name: 'Audio Hint', icon: '🎧', description: 'Hear the first 3 notes' },
  slow_motion: { name: 'Slow Motion', icon: '🐢', description: 'Slow down melody playback' },
  double_xp: { name: 'Double XP', icon: '⚡', description: 'Earn double coins for 24 hours' },
};

export interface StreakMilestone {
  streak: number;
  coins: number;
  hints: number;
  badge: string;
  powerUp?: PowerUpType;
  powerUpCount?: number;
  skinUnlock?: string;
  premiumDays?: number;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { streak: 3, coins: 100, hints: 1, badge: '3-Day Starter', powerUp: 'audio_hint', powerUpCount: 2 },
  { streak: 7, coins: 250, hints: 2, badge: 'Week Warrior', powerUp: 'reveal_note', powerUpCount: 2 },
  { streak: 14, coins: 500, hints: 3, badge: 'Two Week Titan', powerUp: 'extra_guess', powerUpCount: 3 },
  { streak: 21, coins: 750, hints: 4, badge: 'Three Week Pro', skinUnlock: 'ocean' },
  { streak: 30, coins: 1000, hints: 5, badge: 'Monthly Master', premiumDays: 3 },
  { streak: 50, coins: 1500, hints: 7, badge: 'Dedication Hero', skinUnlock: 'sunset' },
  { streak: 75, coins: 2000, hints: 8, badge: 'Melody Devotee', powerUp: 'double_xp', powerUpCount: 5 },
  { streak: 100, coins: 2500, hints: 10, badge: 'Century Legend', skinUnlock: 'midnight', premiumDays: 7 },
  { streak: 200, coins: 5000, hints: 15, badge: 'Bicentennial Star', premiumDays: 14 },
  { streak: 365, coins: 10000, hints: 25, badge: 'Year Champion', premiumDays: 30 },
];

export function getPremiumMultiplier(isPremium: boolean): number {
  return isPremium ? 1.5 : 1;
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 100) return 2.0;
  if (streak >= 50) return 1.75;
  if (streak >= 30) return 1.5;
  if (streak >= 14) return 1.35;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1;
}

export function getStreakMilestone(streak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find(m => m.streak === streak) || null;
}

export function getNextStreakMilestone(currentStreak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find(m => m.streak > currentStreak) || null;
}

export function calculateTotalReward(
  baseReward: DailyRewardItem,
  streak: number,
  isPremium: boolean
): { coins: number; hints: number; multiplier: number } {
  const streakMult = getStreakMultiplier(streak);
  const premiumMult = getPremiumMultiplier(isPremium);
  const totalMult = streakMult * premiumMult;
  
  return {
    coins: Math.floor(baseReward.coins * totalMult),
    hints: baseReward.hints ? Math.floor(baseReward.hints * Math.min(premiumMult, 1.5)) : 0,
    multiplier: totalMult,
  };
}

export function getDailyReward(consecutiveDays: number): DailyRewardItem {
  const dayInCycle = ((consecutiveDays - 1) % DAILY_REWARDS.length);
  const cycleMultiplier = Math.floor((consecutiveDays - 1) / DAILY_REWARDS.length) + 1;
  const baseReward = DAILY_REWARDS[dayInCycle];
  
  return {
    ...baseReward,
    coins: Math.floor(baseReward.coins * Math.min(cycleMultiplier, 3)),
    hints: baseReward.hints ? Math.floor(baseReward.hints * Math.min(cycleMultiplier, 2)) : undefined,
  };
}

export function getSkinById(id: string): KeyboardSkin | undefined {
  return KEYBOARD_SKINS.find(s => s.id === id);
}
