export type BackgroundThemeId = 
  | 'default'
  | 'playful'
  | 'zen'
  | 'eco'
  | 'fever'
  | 'neon'
  | 'minimal';

export interface BackgroundTheme {
  id: BackgroundThemeId;
  name: string;
  description: string;
  isPremium: boolean;
  colors: {
    dark: {
      primary: string;
      secondary: string;
      accent: string;
      surface: string;
    };
    light: {
      primary: string;
      secondary: string;
      accent: string;
      surface: string;
    };
  };
  pattern: 'waves' | 'notes' | 'nebula' | 'forest' | 'flames' | 'grid' | 'solid';
  animationSpeed: 'slow' | 'medium' | 'fast';
}

export const BACKGROUND_THEMES: Record<BackgroundThemeId, BackgroundTheme> = {
  default: {
    id: 'default',
    name: 'Sound Waves',
    description: 'Subtle sound wave gradient with animated pulses',
    isPremium: false,
    colors: {
      dark: {
        primary: '#1E3A8A',
        secondary: '#06B6D4',
        accent: '#8B5CF6',
        surface: 'rgba(30, 58, 138, 0.3)',
      },
      light: {
        primary: '#DBEAFE',
        secondary: '#CFFAFE',
        accent: '#DDD6FE',
        surface: 'rgba(219, 234, 254, 0.5)',
      },
    },
    pattern: 'waves',
    animationSpeed: 'slow',
  },
  playful: {
    id: 'playful',
    name: 'Music Notes',
    description: 'Scattered music notes and symbols',
    isPremium: false,
    colors: {
      dark: {
        primary: '#1F1F1F',
        secondary: '#2A2A2A',
        accent: '#F472B6',
        surface: 'rgba(244, 114, 182, 0.1)',
      },
      light: {
        primary: '#F5F5F4',
        secondary: '#FAFAF9',
        accent: '#EC4899',
        surface: 'rgba(236, 72, 153, 0.1)',
      },
    },
    pattern: 'notes',
    animationSpeed: 'medium',
  },
  zen: {
    id: 'zen',
    name: 'Zen Nebula',
    description: 'Calming cosmic nebula with soft particles',
    isPremium: false,
    colors: {
      dark: {
        primary: '#0F2027',
        secondary: '#203A43',
        accent: '#A78BFA',
        surface: 'rgba(167, 139, 250, 0.1)',
      },
      light: {
        primary: '#F3E8FF',
        secondary: '#E9D5FF',
        accent: '#8B5CF6',
        surface: 'rgba(139, 92, 246, 0.15)',
      },
    },
    pattern: 'nebula',
    animationSpeed: 'slow',
  },
  eco: {
    id: 'eco',
    name: 'Forest Gradient',
    description: 'Earthy green-to-blue with leaf silhouettes',
    isPremium: false,
    colors: {
      dark: {
        primary: '#065F46',
        secondary: '#0D9488',
        accent: '#4ADE80',
        surface: 'rgba(74, 222, 128, 0.1)',
      },
      light: {
        primary: '#D1FAE5',
        secondary: '#A7F3D0',
        accent: '#22C55E',
        surface: 'rgba(34, 197, 94, 0.15)',
      },
    },
    pattern: 'forest',
    animationSpeed: 'slow',
  },
  fever: {
    id: 'fever',
    name: 'Fever Flames',
    description: 'Energetic flames for intense gameplay',
    isPremium: false,
    colors: {
      dark: {
        primary: '#1C1917',
        secondary: '#292524',
        accent: '#FF6B35',
        surface: 'rgba(255, 107, 53, 0.15)',
      },
      light: {
        primary: '#FEF3C7',
        secondary: '#FDE68A',
        accent: '#F97316',
        surface: 'rgba(249, 115, 22, 0.15)',
      },
    },
    pattern: 'flames',
    animationSpeed: 'fast',
  },
  neon: {
    id: 'neon',
    name: 'Neon Grid',
    description: 'Retro cyberpunk neon aesthetic',
    isPremium: true,
    colors: {
      dark: {
        primary: '#0A0A0A',
        secondary: '#171717',
        accent: '#00F5FF',
        surface: 'rgba(0, 245, 255, 0.1)',
      },
      light: {
        primary: '#F0FDFA',
        secondary: '#CCFBF1',
        accent: '#14B8A6',
        surface: 'rgba(20, 184, 166, 0.15)',
      },
    },
    pattern: 'grid',
    animationSpeed: 'medium',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean solid background for accessibility',
    isPremium: false,
    colors: {
      dark: {
        primary: '#0D0D0D',
        secondary: '#1A1A1A',
        accent: '#8B5CF6',
        surface: 'rgba(139, 92, 246, 0.1)',
      },
      light: {
        primary: '#FFFFFF',
        secondary: '#F5F5F5',
        accent: '#7C3AED',
        surface: 'rgba(124, 58, 237, 0.1)',
      },
    },
    pattern: 'solid',
    animationSpeed: 'slow',
  },
};

export const SCREEN_THEME_MAP: Record<string, BackgroundThemeId> = {
  index: 'default',
  fever: 'fever',
  wellness: 'zen',
  eco: 'eco',
  tournaments: 'playful',
  campaign: 'default',
  profile: 'default',
  duels: 'playful',
  events: 'playful',
  shop: 'neon',
  playlists: 'default',
  leaderboard: 'default',
  stats: 'default',
};

export const getThemeForScreen = (screenName: string): BackgroundThemeId => {
  return SCREEN_THEME_MAP[screenName] || 'default';
};
