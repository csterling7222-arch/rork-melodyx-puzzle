export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'skin' | 'hint_pack' | 'coins' | 'premium' | 'color_theme' | 'cosmetic' | 'power_up' | 'learning_pack' | 'instrument_addon' | 'bundle';
  price: number;
  currency: 'coins' | 'usd';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  category?: string;
  previewColors?: string[];
  unlocks?: string[];
  duration?: number;
  isPremiumOnly?: boolean;
}

export interface KeyboardSkin {
  id: string;
  name: string;
  icon: string;
  colors: Record<string, string>;
  textColors: Record<string, string>;
  preview: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  price?: number;
  isPremium?: boolean;
}

export interface ColorTheme {
  id: string;
  name: string;
  icon: string;
  description: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  category: 'fever' | 'eco' | 'wellness' | 'learning' | 'daily' | 'general';
  hasGlow?: boolean;
  hasParticles?: boolean;
}

export interface CosmeticItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'badge' | 'sticker' | 'watermark' | 'profile_frame' | 'title' | 'avatar_effect';
  imageUrl?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  currency: 'coins' | 'usd';
  unlockCondition?: string;
}

export interface PowerUp {
  id: string;
  name: string;
  icon: string;
  description: string;
  effect: string;
  duration?: number;
  stackable: boolean;
  maxStack: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  currency: 'coins' | 'usd';
}

export interface LearningPack {
  id: string;
  name: string;
  icon: string;
  description: string;
  lessons: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  genre?: string;
  rarity: 'rare' | 'epic' | 'legendary';
  price: number;
  currency: 'usd';
  features: string[];
}

export interface InstrumentAddon {
  id: string;
  name: string;
  icon: string;
  description: string;
  instrument: 'piano' | 'guitar' | 'bass' | 'drums' | 'keyboard' | 'all';
  type: 'effect_preset' | 'skin' | 'sound_pack';
  rarity: 'rare' | 'epic' | 'legendary';
  price: number;
  currency: 'coins' | 'usd';
  effects?: string[];
}

export interface ShopBundle {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: string[];
  originalPrice: number;
  bundlePrice: number;
  savings: number;
  rarity: 'epic' | 'legendary';
  featured?: boolean;
  limitedTime?: boolean;
  expiresAt?: string;
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
    rarity: 'common',
    price: 0,
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
    rarity: 'rare',
    price: 500,
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
    rarity: 'rare',
    price: 500,
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
    rarity: 'epic',
    price: 750,
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
    rarity: 'legendary',
    price: 1000,
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    icon: '🌈',
    colors: {
      C: '#00FF87', 'C#': '#0A1628',
      D: '#00E5FF', 'D#': '#0A1628',
      E: '#7B68EE', F: '#FF69B4',
      'F#': '#0A1628', G: '#00CED1',
      'G#': '#0A1628', A: '#9400D3',
      'A#': '#0A1628', B: '#00FF7F',
    },
    textColors: {
      C: '#000000', 'C#': '#00FF87',
      D: '#000000', 'D#': '#00E5FF',
      E: '#FFFFFF', F: '#000000',
      'F#': '#FF69B4', G: '#000000',
      'G#': '#00CED1', A: '#FFFFFF',
      'A#': '#9400D3', B: '#000000',
    },
    preview: 'Northern lights magic',
    rarity: 'legendary',
    price: 1200,
    isPremium: true,
  },
  {
    id: 'cherry_blossom',
    name: 'Cherry Blossom',
    icon: '🌸',
    colors: {
      C: '#FFB7C5', 'C#': '#2D1F24',
      D: '#FF99AC', 'D#': '#2D1F24',
      E: '#FF7B93', F: '#FF5C7A',
      'F#': '#2D1F24', G: '#FFC0CB',
      'G#': '#2D1F24', A: '#FFD1DC',
      'A#': '#2D1F24', B: '#FFE4E9',
    },
    textColors: {
      C: '#4A1F2D', 'C#': '#FFB7C5',
      D: '#4A1F2D', 'D#': '#FF99AC',
      E: '#FFFFFF', F: '#FFFFFF',
      'F#': '#FF5C7A', G: '#4A1F2D',
      'G#': '#FFC0CB', A: '#4A1F2D',
      'A#': '#FFD1DC', B: '#4A1F2D',
    },
    preview: 'Delicate pink petals',
    rarity: 'epic',
    price: 800,
  },
  {
    id: 'forest',
    name: 'Enchanted Forest',
    icon: '🌲',
    colors: {
      C: '#228B22', 'C#': '#0D1F0D',
      D: '#2E8B57', 'D#': '#0D1F0D',
      E: '#3CB371', F: '#66CDAA',
      'F#': '#0D1F0D', G: '#8FBC8F',
      'G#': '#0D1F0D', A: '#98FB98',
      'A#': '#0D1F0D', B: '#90EE90',
    },
    textColors: {
      C: '#FFFFFF', 'C#': '#228B22',
      D: '#FFFFFF', 'D#': '#2E8B57',
      E: '#000000', F: '#000000',
      'F#': '#66CDAA', G: '#000000',
      'G#': '#8FBC8F', A: '#000000',
      'A#': '#98FB98', B: '#000000',
    },
    preview: 'Deep forest greens',
    rarity: 'rare',
    price: 600,
  },
  {
    id: 'cyber',
    name: 'Cyberpunk',
    icon: '🤖',
    colors: {
      C: '#00FFFF', 'C#': '#0A0A14',
      D: '#FF00FF', 'D#': '#0A0A14',
      E: '#FFFF00', F: '#00FF00',
      'F#': '#0A0A14', G: '#FF6600',
      'G#': '#0A0A14', A: '#FF0066',
      'A#': '#0A0A14', B: '#6600FF',
    },
    textColors: {
      C: '#000000', 'C#': '#00FFFF',
      D: '#000000', 'D#': '#FF00FF',
      E: '#000000', F: '#000000',
      'F#': '#00FF00', G: '#000000',
      'G#': '#FF6600', A: '#FFFFFF',
      'A#': '#FF0066', B: '#FFFFFF',
    },
    preview: 'Futuristic neon city',
    rarity: 'legendary',
    price: 1500,
    isPremium: true,
  },
  {
    id: 'golden',
    name: 'Golden Royale',
    icon: '👑',
    colors: {
      C: '#FFD700', 'C#': '#1A1500',
      D: '#DAA520', 'D#': '#1A1500',
      E: '#B8860B', F: '#CD853F',
      'F#': '#1A1500', G: '#D2691E',
      'G#': '#1A1500', A: '#8B4513',
      'A#': '#1A1500', B: '#A0522D',
    },
    textColors: {
      C: '#000000', 'C#': '#FFD700',
      D: '#000000', 'D#': '#DAA520',
      E: '#FFFFFF', F: '#000000',
      'F#': '#CD853F', G: '#FFFFFF',
      'G#': '#D2691E', A: '#FFFFFF',
      'A#': '#8B4513', B: '#FFFFFF',
    },
    preview: 'Luxurious gold tones',
    rarity: 'legendary',
    price: 2000,
    isPremium: true,
  },
  {
    id: 'ice',
    name: 'Frozen Ice',
    icon: '❄️',
    colors: {
      C: '#E0FFFF', 'C#': '#0A1520',
      D: '#B0E0E6', 'D#': '#0A1520',
      E: '#87CEEB', F: '#ADD8E6',
      'F#': '#0A1520', G: '#87CEFA',
      'G#': '#0A1520', A: '#00BFFF',
      'A#': '#0A1520', B: '#1E90FF',
    },
    textColors: {
      C: '#0A1520', 'C#': '#E0FFFF',
      D: '#0A1520', 'D#': '#B0E0E6',
      E: '#0A1520', F: '#0A1520',
      'F#': '#ADD8E6', G: '#0A1520',
      'G#': '#87CEFA', A: '#FFFFFF',
      'A#': '#00BFFF', B: '#FFFFFF',
    },
    preview: 'Crystal ice blues',
    rarity: 'epic',
    price: 850,
  },
  {
    id: 'lava',
    name: 'Volcanic Lava',
    icon: '🌋',
    colors: {
      C: '#FF4500', 'C#': '#1A0A00',
      D: '#FF6347', 'D#': '#1A0A00',
      E: '#DC143C', F: '#B22222',
      'F#': '#1A0A00', G: '#8B0000',
      'G#': '#1A0A00', A: '#FF0000',
      'A#': '#1A0A00', B: '#FF4500',
    },
    textColors: {
      C: '#FFFFFF', 'C#': '#FF4500',
      D: '#FFFFFF', 'D#': '#FF6347',
      E: '#FFFFFF', F: '#FFFFFF',
      'F#': '#B22222', G: '#FFFFFF',
      'G#': '#8B0000', A: '#FFFFFF',
      'A#': '#FF0000', B: '#FFFFFF',
    },
    preview: 'Molten fire colors',
    rarity: 'epic',
    price: 900,
  },
  {
    id: 'pastel_dream',
    name: 'Pastel Dreams',
    icon: '🦄',
    colors: {
      C: '#FFB3BA', 'C#': '#1F1A1F',
      D: '#FFDFBA', 'D#': '#1F1A1F',
      E: '#FFFFBA', F: '#BAFFC9',
      'F#': '#1F1A1F', G: '#BAE1FF',
      'G#': '#1F1A1F', A: '#E2BAFF',
      'A#': '#1F1A1F', B: '#FFBAE1',
    },
    textColors: {
      C: '#4A3A40', 'C#': '#FFB3BA',
      D: '#4A4030', 'D#': '#FFDFBA',
      E: '#4A4A30', F: '#304A35',
      'F#': '#BAFFC9', G: '#30404A',
      'G#': '#BAE1FF', A: '#40304A',
      'A#': '#E2BAFF', B: '#4A3040',
    },
    preview: 'Soft pastel rainbow',
    rarity: 'rare',
    price: 650,
  },
  {
    id: 'monochrome',
    name: 'Noir Elegance',
    icon: '⬛',
    colors: {
      C: '#FFFFFF', 'C#': '#000000',
      D: '#E0E0E0', 'D#': '#000000',
      E: '#C0C0C0', F: '#A0A0A0',
      'F#': '#000000', G: '#808080',
      'G#': '#000000', A: '#606060',
      'A#': '#000000', B: '#404040',
    },
    textColors: {
      C: '#000000', 'C#': '#FFFFFF',
      D: '#000000', 'D#': '#E0E0E0',
      E: '#000000', F: '#000000',
      'F#': '#A0A0A0', G: '#FFFFFF',
      'G#': '#808080', A: '#FFFFFF',
      'A#': '#606060', B: '#FFFFFF',
    },
    preview: 'Classic black & white',
    rarity: 'rare',
    price: 550,
  },
  {
    id: 'nebula',
    name: 'Pastel Nebula',
    icon: '✨',
    colors: {
      C: '#DDA0DD', 'C#': '#1A0F1A',
      D: '#DA70D6', 'D#': '#1A0F1A',
      E: '#EE82EE', F: '#FF00FF',
      'F#': '#1A0F1A', G: '#BA55D3',
      'G#': '#1A0F1A', A: '#9932CC',
      'A#': '#1A0F1A', B: '#8B008B',
    },
    textColors: {
      C: '#1A0F1A', 'C#': '#DDA0DD',
      D: '#FFFFFF', 'D#': '#DA70D6',
      E: '#000000', F: '#000000',
      'F#': '#FF00FF', G: '#FFFFFF',
      'G#': '#BA55D3', A: '#FFFFFF',
      'A#': '#9932CC', B: '#FFFFFF',
    },
    preview: 'Cosmic purple haze',
    rarity: 'legendary',
    price: 1100,
    isPremium: true,
  },
];

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'neon_rainbow',
    name: 'Neon Rainbow',
    icon: '🌈',
    description: 'Vibrant rainbow neon effects',
    primary: '#FF00FF',
    secondary: '#00FFFF',
    accent: '#FFFF00',
    background: '#0A0A14',
    surface: '#14141F',
    text: '#FFFFFF',
    rarity: 'epic',
    price: 400,
    category: 'fever',
    hasGlow: true,
    hasParticles: true,
  },
  {
    id: 'earthy_green',
    name: 'Earth Harmony',
    icon: '🌿',
    description: 'Natural earthy greens',
    primary: '#228B22',
    secondary: '#8FBC8F',
    accent: '#90EE90',
    background: '#0D1F0D',
    surface: '#1A2F1A',
    text: '#E0FFE0',
    rarity: 'rare',
    price: 300,
    category: 'eco',
    hasGlow: false,
  },
  {
    id: 'wellness_zen',
    name: 'Zen Wellness',
    icon: '🧘',
    description: 'Calm lavender tones',
    primary: '#E6E6FA',
    secondary: '#DDA0DD',
    accent: '#DA70D6',
    background: '#1A1A2E',
    surface: '#25254A',
    text: '#F0F0FF',
    rarity: 'rare',
    price: 350,
    category: 'wellness',
    hasGlow: true,
  },
  {
    id: 'ocean_deep',
    name: 'Deep Ocean',
    icon: '🐋',
    description: 'Mysterious ocean depths',
    primary: '#006994',
    secondary: '#40E0D0',
    accent: '#00CED1',
    background: '#001F3F',
    surface: '#003366',
    text: '#E0FFFF',
    rarity: 'epic',
    price: 450,
    category: 'general',
    hasGlow: true,
    hasParticles: true,
  },
  {
    id: 'solar_flare',
    name: 'Solar Flare',
    icon: '☀️',
    description: 'Blazing sun energy',
    primary: '#FF6B35',
    secondary: '#FFD700',
    accent: '#FF4500',
    background: '#1A0A00',
    surface: '#2D1500',
    text: '#FFF5E6',
    rarity: 'legendary',
    price: 600,
    category: 'fever',
    hasGlow: true,
    hasParticles: true,
  },
  {
    id: 'midnight_blue',
    name: 'Midnight Blue',
    icon: '🌙',
    description: 'Peaceful night sky',
    primary: '#191970',
    secondary: '#4169E1',
    accent: '#6495ED',
    background: '#0A0A1F',
    surface: '#141428',
    text: '#E6E6FF',
    rarity: 'rare',
    price: 280,
    category: 'daily',
  },
  {
    id: 'rose_gold',
    name: 'Rose Gold',
    icon: '🌹',
    description: 'Elegant rose gold',
    primary: '#B76E79',
    secondary: '#E8B4B8',
    accent: '#DDA0DD',
    background: '#1F1418',
    surface: '#2D1F24',
    text: '#FFE4E9',
    rarity: 'epic',
    price: 500,
    category: 'general',
    hasGlow: true,
  },
  {
    id: 'learning_focus',
    name: 'Focus Mode',
    icon: '📚',
    description: 'Concentration blue',
    primary: '#38BDF8',
    secondary: '#0EA5E9',
    accent: '#7DD3FC',
    background: '#0C1929',
    surface: '#152238',
    text: '#E0F2FE',
    rarity: 'rare',
    price: 320,
    category: 'learning',
  },
  {
    id: 'candy_pop',
    name: 'Candy Pop',
    icon: '🍬',
    description: 'Sweet candy colors',
    primary: '#FF69B4',
    secondary: '#FF1493',
    accent: '#FFB6C1',
    background: '#1F0A14',
    surface: '#2D141F',
    text: '#FFE4EC',
    rarity: 'epic',
    price: 480,
    category: 'general',
    hasParticles: true,
  },
  {
    id: 'matrix',
    name: 'Matrix Code',
    icon: '💻',
    description: 'Digital green rain',
    primary: '#00FF00',
    secondary: '#008000',
    accent: '#32CD32',
    background: '#000A00',
    surface: '#001400',
    text: '#00FF00',
    rarity: 'legendary',
    price: 700,
    category: 'general',
    hasGlow: true,
    hasParticles: true,
  },
];

export const COSMETIC_ITEMS: CosmeticItem[] = [
  {
    id: 'badge_champion',
    name: 'Champion Badge',
    icon: '🏆',
    description: 'Show your mastery',
    type: 'badge',
    rarity: 'legendary',
    price: 1500,
    currency: 'coins',
  },
  {
    id: 'badge_streak_master',
    name: 'Streak Master',
    icon: '🔥',
    description: '30+ day streak badge',
    type: 'badge',
    rarity: 'epic',
    price: 1000,
    currency: 'coins',
    unlockCondition: 'Achieve 30-day streak',
  },
  {
    id: 'badge_perfectionist',
    name: 'Perfectionist',
    icon: '💎',
    description: 'Perfect solve badge',
    type: 'badge',
    rarity: 'epic',
    price: 800,
    currency: 'coins',
  },
  {
    id: 'badge_fever_king',
    name: 'Fever King',
    icon: '👑',
    description: 'Fever mode champion',
    type: 'badge',
    rarity: 'legendary',
    price: 1200,
    currency: 'coins',
  },
  {
    id: 'sticker_music_note',
    name: 'Music Note',
    icon: '🎵',
    description: 'Animated music note',
    type: 'sticker',
    rarity: 'common',
    price: 200,
    currency: 'coins',
  },
  {
    id: 'sticker_star_burst',
    name: 'Star Burst',
    icon: '⭐',
    description: 'Sparkling star effect',
    type: 'sticker',
    rarity: 'rare',
    price: 350,
    currency: 'coins',
  },
  {
    id: 'sticker_confetti',
    name: 'Confetti Blast',
    icon: '🎊',
    description: 'Celebration confetti',
    type: 'sticker',
    rarity: 'rare',
    price: 400,
    currency: 'coins',
  },
  {
    id: 'sticker_rainbow',
    name: 'Rainbow Swirl',
    icon: '🌈',
    description: 'Animated rainbow',
    type: 'sticker',
    rarity: 'epic',
    price: 600,
    currency: 'coins',
  },
  {
    id: 'watermark_melodyx',
    name: 'Melodyx Signature',
    icon: '✍️',
    description: 'Official Melodyx watermark',
    type: 'watermark',
    rarity: 'common',
    price: 150,
    currency: 'coins',
  },
  {
    id: 'watermark_pro',
    name: 'Pro Player',
    icon: '🎯',
    description: 'Pro player watermark',
    type: 'watermark',
    rarity: 'rare',
    price: 450,
    currency: 'coins',
  },
  {
    id: 'watermark_legend',
    name: 'Legend Status',
    icon: '⚡',
    description: 'Legendary watermark',
    type: 'watermark',
    rarity: 'legendary',
    price: 1000,
    currency: 'coins',
  },
  {
    id: 'frame_gold',
    name: 'Golden Frame',
    icon: '🖼️',
    description: 'Luxurious gold profile frame',
    type: 'profile_frame',
    rarity: 'legendary',
    price: 2000,
    currency: 'coins',
  },
  {
    id: 'frame_neon',
    name: 'Neon Glow Frame',
    icon: '💫',
    description: 'Animated neon frame',
    type: 'profile_frame',
    rarity: 'epic',
    price: 1200,
    currency: 'coins',
  },
  {
    id: 'frame_nature',
    name: 'Nature Frame',
    icon: '🌿',
    description: 'Organic leaf frame',
    type: 'profile_frame',
    rarity: 'rare',
    price: 600,
    currency: 'coins',
  },
  {
    id: 'title_maestro',
    name: 'Maestro',
    icon: '🎼',
    description: 'Maestro title',
    type: 'title',
    rarity: 'legendary',
    price: 1800,
    currency: 'coins',
  },
  {
    id: 'title_virtuoso',
    name: 'Virtuoso',
    icon: '🎹',
    description: 'Virtuoso title',
    type: 'title',
    rarity: 'epic',
    price: 1100,
    currency: 'coins',
  },
  {
    id: 'title_rising_star',
    name: 'Rising Star',
    icon: '🌟',
    description: 'Rising Star title',
    type: 'title',
    rarity: 'rare',
    price: 500,
    currency: 'coins',
  },
  {
    id: 'effect_sparkle',
    name: 'Sparkle Aura',
    icon: '✨',
    description: 'Sparkling avatar effect',
    type: 'avatar_effect',
    rarity: 'epic',
    price: 900,
    currency: 'coins',
  },
  {
    id: 'effect_flame',
    name: 'Flame Aura',
    icon: '🔥',
    description: 'Fiery avatar effect',
    type: 'avatar_effect',
    rarity: 'legendary',
    price: 1400,
    currency: 'coins',
  },
];

export const POWER_UPS: PowerUp[] = [
  {
    id: 'hint_reveal',
    name: 'Reveal Note',
    icon: '👁️',
    description: 'Reveal one correct note position',
    effect: 'reveal_note',
    stackable: true,
    maxStack: 99,
    rarity: 'common',
    price: 100,
    currency: 'coins',
  },
  {
    id: 'extra_guess',
    name: 'Extra Guess',
    icon: '➕',
    description: 'Get one additional guess attempt',
    effect: 'extra_guess',
    stackable: true,
    maxStack: 10,
    rarity: 'rare',
    price: 200,
    currency: 'coins',
  },
  {
    id: 'audio_hint',
    name: 'Audio Hint',
    icon: '🎧',
    description: 'Hear the first 3 notes',
    effect: 'audio_hint',
    stackable: true,
    maxStack: 50,
    rarity: 'rare',
    price: 250,
    currency: 'coins',
  },

  {
    id: 'double_xp',
    name: 'Double XP',
    icon: '⚡',
    description: 'Earn double coins for 24 hours',
    effect: 'double_xp',
    duration: 24 * 60 * 60 * 1000,
    stackable: false,
    maxStack: 1,
    rarity: 'epic',
    price: 500,
    currency: 'coins',
  },
  {
    id: 'skip_note',
    name: 'Skip Note',
    icon: '⏭️',
    description: 'Skip one difficult note',
    effect: 'skip_note',
    stackable: true,
    maxStack: 20,
    rarity: 'rare',
    price: 180,
    currency: 'coins',
  },
  {
    id: 'fever_boost',
    name: 'Fever Boost',
    icon: '🔥',
    description: 'Start Fever with 2x multiplier',
    effect: 'fever_boost',
    stackable: true,
    maxStack: 10,
    rarity: 'epic',
    price: 400,
    currency: 'coins',
  },
  {
    id: 'time_freeze',
    name: 'Time Freeze',
    icon: '⏱️',
    description: 'Pause the timer for 30 seconds',
    effect: 'time_freeze',
    duration: 30000,
    stackable: true,
    maxStack: 15,
    rarity: 'legendary',
    price: 600,
    currency: 'coins',
  },
  {
    id: 'shield',
    name: 'Mistake Shield',
    icon: '🛡️',
    description: 'Protect from one wrong guess',
    effect: 'shield',
    stackable: true,
    maxStack: 10,
    rarity: 'epic',
    price: 350,
    currency: 'coins',
  },
  {
    id: 'streak_saver',
    name: 'Streak Saver',
    icon: '💪',
    description: 'Protect your daily streak once',
    effect: 'streak_saver',
    stackable: true,
    maxStack: 5,
    rarity: 'legendary',
    price: 800,
    currency: 'coins',
  },
];

export const LEARNING_PACKS: LearningPack[] = [
  {
    id: 'ai_drill_beginner',
    name: 'AI Beginner Drills',
    icon: '🤖',
    description: 'AI-powered practice for beginners',
    lessons: 50,
    difficulty: 'beginner',
    rarity: 'rare',
    price: 2.99,
    currency: 'usd',
    features: ['Personalized pace', 'Real-time feedback', 'Progress tracking'],
  },
  {
    id: 'ai_drill_advanced',
    name: 'AI Advanced Drills',
    icon: '🧠',
    description: 'Advanced AI training modules',
    lessons: 100,
    difficulty: 'advanced',
    rarity: 'epic',
    price: 5.99,
    currency: 'usd',
    features: ['Complex patterns', 'Style analysis', 'Performance metrics'],
  },
  {
    id: 'jazz_curriculum',
    name: 'Jazz Mastery',
    icon: '🎷',
    description: 'Complete jazz improvisation course',
    lessons: 75,
    difficulty: 'intermediate',
    genre: 'jazz',
    rarity: 'epic',
    price: 4.99,
    currency: 'usd',
    features: ['Chord progressions', 'Scale patterns', 'Improvisation tips'],
  },
  {
    id: 'rock_curriculum',
    name: 'Rock Legends',
    icon: '🎸',
    description: 'Classic rock techniques',
    lessons: 60,
    difficulty: 'intermediate',
    genre: 'rock',
    rarity: 'rare',
    price: 3.99,
    currency: 'usd',
    features: ['Power chords', 'Riff patterns', 'Solo techniques'],
  },
  {
    id: 'classical_curriculum',
    name: 'Classical Foundations',
    icon: '🎻',
    description: 'Classical music theory and practice',
    lessons: 80,
    difficulty: 'advanced',
    genre: 'classical',
    rarity: 'epic',
    price: 6.99,
    currency: 'usd',
    features: ['Music theory', 'Sight reading', 'Composition basics'],
  },
  {
    id: 'ear_training_pro',
    name: 'Ear Training Pro',
    icon: '👂',
    description: 'Professional ear training',
    lessons: 120,
    difficulty: 'master',
    rarity: 'legendary',
    price: 9.99,
    currency: 'usd',
    features: ['Interval recognition', 'Chord identification', 'Perfect pitch training'],
  },
];

export const INSTRUMENT_ADDONS: InstrumentAddon[] = [
  {
    id: 'piano_vintage',
    name: 'Vintage Piano',
    icon: '🎹',
    description: 'Classic grand piano sound',
    instrument: 'piano',
    type: 'sound_pack',
    rarity: 'rare',
    price: 300,
    currency: 'coins',
  },
  {
    id: 'guitar_glow',
    name: 'Guitar Glow Pack',
    icon: '🎸',
    description: 'Visual effects for guitar',
    instrument: 'guitar',
    type: 'skin',
    rarity: 'epic',
    price: 2.99,
    currency: 'usd',
    effects: ['Neon strings', 'Particle trails', 'Glow frets'],
  },
  {
    id: 'drums_thunder',
    name: 'Thunder Drums',
    icon: '🥁',
    description: 'Powerful drum effects',
    instrument: 'drums',
    type: 'effect_preset',
    rarity: 'epic',
    price: 500,
    currency: 'coins',
    effects: ['Deep bass', 'Reverb crash', 'Punch effect'],
  },
  {
    id: 'bass_groove',
    name: 'Groove Bass',
    icon: '🎵',
    description: 'Funky bass presets',
    instrument: 'bass',
    type: 'effect_preset',
    rarity: 'rare',
    price: 400,
    currency: 'coins',
    effects: ['Slap bass', 'Warm tone', 'Compression'],
  },
  {
    id: 'keyboard_synth',
    name: 'Synth Wave',
    icon: '🎛️',
    description: 'Retro synth sounds',
    instrument: 'keyboard',
    type: 'sound_pack',
    rarity: 'epic',
    price: 600,
    currency: 'coins',
  },
  {
    id: 'all_neon_pack',
    name: 'Neon All Pack',
    icon: '💜',
    description: 'Neon effects for all instruments',
    instrument: 'all',
    type: 'skin',
    rarity: 'legendary',
    price: 4.99,
    currency: 'usd',
    effects: ['Neon glow', 'Color pulse', 'Particle effects'],
  },
  {
    id: 'piano_electric',
    name: 'Electric Piano',
    icon: '⚡',
    description: 'Rhodes-style electric piano',
    instrument: 'piano',
    type: 'sound_pack',
    rarity: 'epic',
    price: 450,
    currency: 'coins',
  },
  {
    id: 'guitar_acoustic',
    name: 'Acoustic Dreams',
    icon: '🪕',
    description: 'Warm acoustic guitar tones',
    instrument: 'guitar',
    type: 'sound_pack',
    rarity: 'rare',
    price: 350,
    currency: 'coins',
  },
];

export const SHOP_BUNDLES: ShopBundle[] = [
  {
    id: 'color_pack_pro',
    name: 'Color Pack Pro',
    icon: '🎨',
    description: 'All color themes + unlimited swaps',
    items: ['neon_rainbow', 'earthy_green', 'wellness_zen', 'ocean_deep', 'solar_flare', 'rose_gold'],
    originalPrice: 2400,
    bundlePrice: 1.99,
    savings: 60,
    rarity: 'epic',
    featured: true,
  },
  {
    id: 'starter_kit',
    name: 'Starter Kit',
    icon: '🎁',
    description: '10 hints + Neon theme',
    items: ['hints_10', 'neon_rainbow'],
    originalPrice: 800,
    bundlePrice: 0.99,
    savings: 50,
    rarity: 'epic',
  },
  {
    id: 'power_up_pack',
    name: 'Power Up Pack',
    icon: '⚡',
    description: 'Essential power-ups bundle',
    items: ['hint_reveal_5', 'extra_guess_3', 'audio_hint_3', 'shield_2'],
    originalPrice: 1500,
    bundlePrice: 2.99,
    savings: 55,
    rarity: 'epic',
  },
  {
    id: 'cosmetic_collection',
    name: 'Cosmetic Collection',
    icon: '👑',
    description: 'Badges, frames, and effects',
    items: ['badge_champion', 'frame_gold', 'effect_sparkle', 'watermark_legend'],
    originalPrice: 5400,
    bundlePrice: 9.99,
    savings: 45,
    rarity: 'legendary',
    featured: true,
  },
  {
    id: 'learning_complete',
    name: 'Learning Complete',
    icon: '📚',
    description: 'All learning packs + AI drills',
    items: ['ai_drill_beginner', 'ai_drill_advanced', 'jazz_curriculum', 'rock_curriculum', 'ear_training_pro'],
    originalPrice: 27.95,
    bundlePrice: 19.99,
    savings: 30,
    rarity: 'legendary',
    featured: true,
  },
  {
    id: 'fever_champion',
    name: 'Fever Champion',
    icon: '🔥',
    description: 'Fever mode essentials',
    items: ['fever_boost_5', 'time_freeze_3', 'double_xp', 'solar_flare'],
    originalPrice: 2000,
    bundlePrice: 3.99,
    savings: 50,
    rarity: 'epic',
  },
  {
    id: 'instrument_master',
    name: 'Instrument Master',
    icon: '🎹',
    description: 'All instrument add-ons',
    items: ['piano_vintage', 'guitar_glow', 'drums_thunder', 'bass_groove', 'keyboard_synth'],
    originalPrice: 12.99,
    bundlePrice: 7.99,
    savings: 40,
    rarity: 'legendary',
  },
  {
    id: 'skin_collector',
    name: 'Skin Collector',
    icon: '🌈',
    description: 'All keyboard skins',
    items: ['neon', 'ocean', 'sunset', 'midnight', 'aurora', 'cherry_blossom', 'cyber', 'golden'],
    originalPrice: 8000,
    bundlePrice: 14.99,
    savings: 50,
    rarity: 'legendary',
    featured: true,
  },
];

export const SHOP_ITEMS: ShopItem[] = [
  ...KEYBOARD_SKINS.filter(s => s.id !== 'default').map(skin => ({
    id: `skin_${skin.id}`,
    name: skin.name,
    description: skin.preview,
    icon: skin.icon,
    type: 'skin' as const,
    price: skin.price || 500,
    currency: 'coins' as const,
    rarity: skin.rarity || 'rare' as const,
    color: Object.values(skin.colors)[0],
    isPremiumOnly: skin.isPremium,
  })),
  ...COLOR_THEMES.map(theme => ({
    id: `theme_${theme.id}`,
    name: theme.name,
    description: theme.description,
    icon: theme.icon,
    type: 'color_theme' as const,
    price: theme.price,
    currency: 'coins' as const,
    rarity: theme.rarity,
    color: theme.primary,
    category: theme.category,
    previewColors: [theme.primary, theme.secondary, theme.accent],
  })),
  ...COSMETIC_ITEMS.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    icon: item.icon,
    type: 'cosmetic' as const,
    price: item.price,
    currency: item.currency,
    rarity: item.rarity,
    color: '#FFD700',
    category: item.type,
  })),
  ...POWER_UPS.map(powerUp => ({
    id: powerUp.id,
    name: powerUp.name,
    description: powerUp.description,
    icon: powerUp.icon,
    type: 'power_up' as const,
    price: powerUp.price,
    currency: powerUp.currency,
    rarity: powerUp.rarity,
    color: '#8B5CF6',
    duration: powerUp.duration,
  })),
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

export type PowerUpType = 'skip_note' | 'reveal_note' | 'extra_guess' | 'audio_hint' | 'double_xp' | 'fever_boost' | 'time_freeze' | 'shield' | 'streak_saver';

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
  double_xp: { name: 'Double XP', icon: '⚡', description: 'Earn double coins for 24 hours' },
  fever_boost: { name: 'Fever Boost', icon: '🔥', description: 'Start Fever with 2x multiplier' },
  time_freeze: { name: 'Time Freeze', icon: '⏱️', description: 'Pause the timer for 30 seconds' },
  shield: { name: 'Mistake Shield', icon: '🛡️', description: 'Protect from one wrong guess' },
  streak_saver: { name: 'Streak Saver', icon: '💪', description: 'Protect your daily streak once' },
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

export function getColorThemeById(id: string): ColorTheme | undefined {
  return COLOR_THEMES.find(t => t.id === id);
}

export function getCosmeticById(id: string): CosmeticItem | undefined {
  return COSMETIC_ITEMS.find(c => c.id === id);
}

export function getPowerUpById(id: string): PowerUp | undefined {
  return POWER_UPS.find(p => p.id === id);
}

export function getLearningPackById(id: string): LearningPack | undefined {
  return LEARNING_PACKS.find(l => l.id === id);
}

export function getInstrumentAddonById(id: string): InstrumentAddon | undefined {
  return INSTRUMENT_ADDONS.find(a => a.id === id);
}

export function getBundleById(id: string): ShopBundle | undefined {
  return SHOP_BUNDLES.find(b => b.id === id);
}

export function getItemsByCategory(category: string): ShopItem[] {
  return SHOP_ITEMS.filter(item => item.category === category);
}

export function getItemsByRarity(rarity: 'common' | 'rare' | 'epic' | 'legendary'): ShopItem[] {
  return SHOP_ITEMS.filter(item => item.rarity === rarity);
}

export function getFeaturedBundles(): ShopBundle[] {
  return SHOP_BUNDLES.filter(b => b.featured);
}

export function getLimitedTimeBundles(): ShopBundle[] {
  return SHOP_BUNDLES.filter(b => b.limitedTime && b.expiresAt && new Date(b.expiresAt) > new Date());
}
