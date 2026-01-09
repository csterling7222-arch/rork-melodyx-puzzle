export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'fever' | 'global' | 'skill' | 'social' | 'special' | 'eco';
  requirement: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  color: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'streak',
    requirement: 7,
    tier: 'bronze',
    color: '#CD7F32',
  },
  {
    id: 'streak_30',
    name: 'Melody Master',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    category: 'streak',
    requirement: 30,
    tier: 'gold',
    color: '#FFD700',
  },
  {
    id: 'streak_100',
    name: 'Legendary Listener',
    description: 'Maintain a 100-day streak',
    icon: '💎',
    category: 'streak',
    requirement: 100,
    tier: 'platinum',
    color: '#E5E4E2',
  },
  {
    id: 'streak_365',
    name: 'Year of Music',
    description: 'Maintain a 365-day streak',
    icon: '🏆',
    category: 'streak',
    requirement: 365,
    tier: 'platinum',
    color: '#B9F2FF',
  },

  // Fever achievements
  {
    id: 'fever_10',
    name: 'Fever Starter',
    description: 'Solve 10 puzzles in Fever Mode',
    icon: '🌡️',
    category: 'fever',
    requirement: 10,
    tier: 'bronze',
    color: '#CD7F32',
  },
  {
    id: 'fever_50',
    name: 'Fever Fighter',
    description: 'Solve 50 puzzles in Fever Mode',
    icon: '⚡',
    category: 'fever',
    requirement: 50,
    tier: 'silver',
    color: '#C0C0C0',
  },
  {
    id: 'fever_100',
    name: 'Riff Raider',
    description: 'Solve 100 puzzles in Fever Mode',
    icon: '🎸',
    category: 'fever',
    requirement: 100,
    tier: 'gold',
    color: '#FFD700',
  },
  {
    id: 'fever_500',
    name: 'Fever Legend',
    description: 'Solve 500 puzzles in Fever Mode',
    icon: '🔥',
    category: 'fever',
    requirement: 500,
    tier: 'platinum',
    color: '#E5E4E2',
  },

  // Score achievements
  {
    id: 'score_10k',
    name: 'Point Collector',
    description: 'Reach 10,000 total Fever points',
    icon: '💯',
    category: 'fever',
    requirement: 10000,
    tier: 'bronze',
    color: '#CD7F32',
  },
  {
    id: 'score_100k',
    name: 'Score Hunter',
    description: 'Reach 100,000 total Fever points',
    icon: '🎯',
    category: 'fever',
    requirement: 100000,
    tier: 'gold',
    color: '#FFD700',
  },

  // Global/International achievements
  {
    id: 'global_5',
    name: 'World Traveler',
    description: 'Play melodies from 5 different countries',
    icon: '🌍',
    category: 'global',
    requirement: 5,
    tier: 'bronze',
    color: '#CD7F32',
  },
  {
    id: 'global_10',
    name: 'Global Groover',
    description: 'Play melodies from 10 different countries',
    icon: '🌎',
    category: 'global',
    requirement: 10,
    tier: 'silver',
    color: '#C0C0C0',
  },
  {
    id: 'global_20',
    name: 'Melody Ambassador',
    description: 'Play melodies from 20 different countries',
    icon: '🌏',
    category: 'global',
    requirement: 20,
    tier: 'gold',
    color: '#FFD700',
  },

  // Skill achievements
  {
    id: 'perfect_1',
    name: 'Perfect Pitch',
    description: 'Solve a puzzle on the first try',
    icon: '✨',
    category: 'skill',
    requirement: 1,
    tier: 'silver',
    color: '#C0C0C0',
  },
  {
    id: 'perfect_10',
    name: 'Flawless Ten',
    description: 'Get 10 first-try solves',
    icon: '🌟',
    category: 'skill',
    requirement: 10,
    tier: 'gold',
    color: '#FFD700',
  },
  {
    id: 'wins_50',
    name: 'Dedicated Player',
    description: 'Win 50 daily puzzles',
    icon: '🎵',
    category: 'skill',
    requirement: 50,
    tier: 'silver',
    color: '#C0C0C0',
  },
  {
    id: 'wins_100',
    name: 'Century Club',
    description: 'Win 100 daily puzzles',
    icon: '🎼',
    category: 'skill',
    requirement: 100,
    tier: 'gold',
    color: '#FFD700',
  },

  // Social achievements
  {
    id: 'share_1',
    name: 'First Share',
    description: 'Share your first result',
    icon: '📤',
    category: 'social',
    requirement: 1,
    tier: 'bronze',
    color: '#CD7F32',
  },
  {
    id: 'share_10',
    name: 'Social Butterfly',
    description: 'Share 10 results',
    icon: '🦋',
    category: 'social',
    requirement: 10,
    tier: 'silver',
    color: '#C0C0C0',
  },
  {
    id: 'duel_1',
    name: 'Duel Debut',
    description: 'Complete your first duel',
    icon: '⚔️',
    category: 'social',
    requirement: 1,
    tier: 'bronze',
    color: '#CD7F32',
  },
  {
    id: 'duel_win_10',
    name: 'Duel Champion',
    description: 'Win 10 duels',
    icon: '🏅',
    category: 'social',
    requirement: 10,
    tier: 'gold',
    color: '#FFD700',
  },

  // Special achievements
  {
    id: 'event_1',
    name: 'Event Explorer',
    description: 'Complete your first themed event',
    icon: '🎪',
    category: 'special',
    requirement: 1,
    tier: 'bronze',
    color: '#CD7F32',
  },
  {
    id: 'event_5',
    name: 'Event Enthusiast',
    description: 'Complete 5 themed events',
    icon: '🎭',
    category: 'special',
    requirement: 5,
    tier: 'silver',
    color: '#C0C0C0',
  },
  {
    id: 'ugc_create',
    name: 'Composer',
    description: 'Create your first user melody',
    icon: '🎹',
    category: 'special',
    requirement: 1,
    tier: 'bronze',
    color: '#CD7F32',
  },
  {
    id: 'ugc_featured',
    name: 'Featured Artist',
    description: 'Have a melody featured in daily puzzles',
    icon: '⭐',
    category: 'special',
    requirement: 1,
    tier: 'gold',
    color: '#FFD700',
  },

  // Eco achievements
  {
    id: 'eco_100',
    name: 'Eco Seed',
    description: 'Earn 100 eco points',
    icon: '🌱',
    category: 'eco',
    requirement: 100,
    tier: 'bronze',
    color: '#22C55E',
  },
  {
    id: 'eco_500',
    name: 'Green Sprout',
    description: 'Earn 500 eco points',
    icon: '🌿',
    category: 'eco',
    requirement: 500,
    tier: 'silver',
    color: '#10B981',
  },
  {
    id: 'eco_1000',
    name: 'Carbon Neutral',
    description: 'Offset 1 ton of CO2',
    icon: '🌳',
    category: 'eco',
    requirement: 1000,
    tier: 'gold',
    color: '#059669',
  },
  {
    id: 'eco_5000',
    name: 'Eco Champion',
    description: 'Offset 5 tons of CO2',
    icon: '🌍',
    category: 'eco',
    requirement: 5000,
    tier: 'platinum',
    color: '#047857',
  },
  {
    id: 'eco_harmonist',
    name: 'Eco-Harmonist',
    description: 'Complete all eco melodies',
    icon: '🎶',
    category: 'eco',
    requirement: 10,
    tier: 'gold',
    color: '#34D399',
  },
];

export const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category);
}
