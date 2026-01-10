export type BackgroundThemeId = 
  | 'default'
  | 'playful'
  | 'zen'
  | 'eco'
  | 'fever'
  | 'neon'
  | 'minimal'
  | 'aurora'
  | 'sunset'
  | 'ocean'
  | 'cosmic'
  | 'learning';

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
      particle: string;
      glow: string;
    };
    light: {
      primary: string;
      secondary: string;
      accent: string;
      surface: string;
      particle: string;
      glow: string;
    };
  };
  pattern: 'waves' | 'notes' | 'nebula' | 'forest' | 'flames' | 'grid' | 'solid' | 'aurora' | 'ocean' | 'cosmic';
  animationSpeed: 'slow' | 'medium' | 'fast';
  particleType: 'ambient' | 'fever' | 'zen' | 'eco' | 'celebration';
  hasGlow: boolean;
}

export const BACKGROUND_THEMES: Record<BackgroundThemeId, BackgroundTheme> = {
  default: {
    id: 'default',
    name: 'Sound Waves',
    description: 'Dynamic sound wave gradient with animated pulses',
    isPremium: false,
    colors: {
      dark: {
        primary: '#0F172A',
        secondary: '#1E3A5F',
        accent: '#60A5FA',
        surface: 'rgba(30, 58, 95, 0.4)',
        particle: '#60A5FA',
        glow: 'rgba(96, 165, 250, 0.3)',
      },
      light: {
        primary: '#E0F2FE',
        secondary: '#BAE6FD',
        accent: '#0284C7',
        surface: 'rgba(186, 230, 253, 0.5)',
        particle: '#0284C7',
        glow: 'rgba(2, 132, 199, 0.2)',
      },
    },
    pattern: 'waves',
    animationSpeed: 'slow',
    particleType: 'ambient',
    hasGlow: true,
  },
  playful: {
    id: 'playful',
    name: 'Music Notes',
    description: 'Scattered music notes with playful animations',
    isPremium: false,
    colors: {
      dark: {
        primary: '#18181B',
        secondary: '#27272A',
        accent: '#F472B6',
        surface: 'rgba(244, 114, 182, 0.15)',
        particle: '#F472B6',
        glow: 'rgba(244, 114, 182, 0.25)',
      },
      light: {
        primary: '#FDF2F8',
        secondary: '#FCE7F3',
        accent: '#DB2777',
        surface: 'rgba(219, 39, 119, 0.1)',
        particle: '#DB2777',
        glow: 'rgba(219, 39, 119, 0.15)',
      },
    },
    pattern: 'notes',
    animationSpeed: 'medium',
    particleType: 'ambient',
    hasGlow: false,
  },
  zen: {
    id: 'zen',
    name: 'Zen Nebula',
    description: 'Calming cosmic nebula with soft glowing particles',
    isPremium: false,
    colors: {
      dark: {
        primary: '#0C0A1D',
        secondary: '#1A1533',
        accent: '#A78BFA',
        surface: 'rgba(167, 139, 250, 0.12)',
        particle: '#C4B5FD',
        glow: 'rgba(196, 181, 253, 0.35)',
      },
      light: {
        primary: '#F5F3FF',
        secondary: '#EDE9FE',
        accent: '#7C3AED',
        surface: 'rgba(124, 58, 237, 0.12)',
        particle: '#7C3AED',
        glow: 'rgba(124, 58, 237, 0.2)',
      },
    },
    pattern: 'nebula',
    animationSpeed: 'slow',
    particleType: 'zen',
    hasGlow: true,
  },
  eco: {
    id: 'eco',
    name: 'Forest Gradient',
    description: 'Earthy green-to-teal with floating leaf particles',
    isPremium: false,
    colors: {
      dark: {
        primary: '#052E16',
        secondary: '#064E3B',
        accent: '#34D399',
        surface: 'rgba(52, 211, 153, 0.12)',
        particle: '#6EE7B7',
        glow: 'rgba(110, 231, 183, 0.25)',
      },
      light: {
        primary: '#ECFDF5',
        secondary: '#D1FAE5',
        accent: '#059669',
        surface: 'rgba(5, 150, 105, 0.12)',
        particle: '#059669',
        glow: 'rgba(5, 150, 105, 0.15)',
      },
    },
    pattern: 'forest',
    animationSpeed: 'slow',
    particleType: 'eco',
    hasGlow: true,
  },
  fever: {
    id: 'fever',
    name: 'Fever Flames',
    description: 'Intense flickering flames for high-energy gameplay',
    isPremium: false,
    colors: {
      dark: {
        primary: '#1C1917',
        secondary: '#292524',
        accent: '#FF6B35',
        surface: 'rgba(255, 107, 53, 0.18)',
        particle: '#FBBF24',
        glow: 'rgba(251, 191, 36, 0.4)',
      },
      light: {
        primary: '#FFFBEB',
        secondary: '#FEF3C7',
        accent: '#EA580C',
        surface: 'rgba(234, 88, 12, 0.15)',
        particle: '#EA580C',
        glow: 'rgba(234, 88, 12, 0.2)',
      },
    },
    pattern: 'flames',
    animationSpeed: 'fast',
    particleType: 'fever',
    hasGlow: true,
  },
  neon: {
    id: 'neon',
    name: 'Neon Grid',
    description: 'Retro cyberpunk neon aesthetic with grid lines',
    isPremium: true,
    colors: {
      dark: {
        primary: '#030712',
        secondary: '#111827',
        accent: '#00F5FF',
        surface: 'rgba(0, 245, 255, 0.12)',
        particle: '#00F5FF',
        glow: 'rgba(0, 245, 255, 0.35)',
      },
      light: {
        primary: '#F0FDFA',
        secondary: '#CCFBF1',
        accent: '#0D9488',
        surface: 'rgba(13, 148, 136, 0.15)',
        particle: '#0D9488',
        glow: 'rgba(13, 148, 136, 0.2)',
      },
    },
    pattern: 'grid',
    animationSpeed: 'medium',
    particleType: 'ambient',
    hasGlow: true,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean solid background for accessibility focus',
    isPremium: false,
    colors: {
      dark: {
        primary: '#0A0A0A',
        secondary: '#171717',
        accent: '#A1A1AA',
        surface: 'rgba(161, 161, 170, 0.1)',
        particle: '#A1A1AA',
        glow: 'rgba(161, 161, 170, 0.15)',
      },
      light: {
        primary: '#FAFAFA',
        secondary: '#F4F4F5',
        accent: '#52525B',
        surface: 'rgba(82, 82, 91, 0.1)',
        particle: '#52525B',
        glow: 'rgba(82, 82, 91, 0.1)',
      },
    },
    pattern: 'solid',
    animationSpeed: 'slow',
    particleType: 'ambient',
    hasGlow: false,
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'Mesmerizing northern lights with color waves',
    isPremium: true,
    colors: {
      dark: {
        primary: '#0F0F23',
        secondary: '#1A1A3E',
        accent: '#00D9FF',
        surface: 'rgba(0, 217, 255, 0.12)',
        particle: '#7DF9FF',
        glow: 'rgba(125, 249, 255, 0.3)',
      },
      light: {
        primary: '#E0F7FA',
        secondary: '#B2EBF2',
        accent: '#00ACC1',
        surface: 'rgba(0, 172, 193, 0.12)',
        particle: '#00ACC1',
        glow: 'rgba(0, 172, 193, 0.2)',
      },
    },
    pattern: 'aurora',
    animationSpeed: 'slow',
    particleType: 'zen',
    hasGlow: true,
  },
  sunset: {
    id: 'sunset',
    name: 'Golden Sunset',
    description: 'Warm gradient with golden hour vibes',
    isPremium: true,
    colors: {
      dark: {
        primary: '#1F1209',
        secondary: '#3D240D',
        accent: '#F59E0B',
        surface: 'rgba(245, 158, 11, 0.15)',
        particle: '#FCD34D',
        glow: 'rgba(252, 211, 77, 0.35)',
      },
      light: {
        primary: '#FEF3C7',
        secondary: '#FDE68A',
        accent: '#D97706',
        surface: 'rgba(217, 119, 6, 0.12)',
        particle: '#D97706',
        glow: 'rgba(217, 119, 6, 0.2)',
      },
    },
    pattern: 'waves',
    animationSpeed: 'slow',
    particleType: 'ambient',
    hasGlow: true,
  },
  ocean: {
    id: 'ocean',
    name: 'Deep Ocean',
    description: 'Tranquil underwater with floating bubbles',
    isPremium: true,
    colors: {
      dark: {
        primary: '#0A1628',
        secondary: '#0F2744',
        accent: '#38BDF8',
        surface: 'rgba(56, 189, 248, 0.12)',
        particle: '#7DD3FC',
        glow: 'rgba(125, 211, 252, 0.3)',
      },
      light: {
        primary: '#E0F2FE',
        secondary: '#BAE6FD',
        accent: '#0284C7',
        surface: 'rgba(2, 132, 199, 0.12)',
        particle: '#0284C7',
        glow: 'rgba(2, 132, 199, 0.2)',
      },
    },
    pattern: 'ocean',
    animationSpeed: 'slow',
    particleType: 'zen',
    hasGlow: true,
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Galaxy',
    description: 'Deep space with twinkling stars and nebulae',
    isPremium: true,
    colors: {
      dark: {
        primary: '#0D0015',
        secondary: '#1A0033',
        accent: '#E879F9',
        surface: 'rgba(232, 121, 249, 0.12)',
        particle: '#F0ABFC',
        glow: 'rgba(240, 171, 252, 0.35)',
      },
      light: {
        primary: '#FAF5FF',
        secondary: '#F3E8FF',
        accent: '#A855F7',
        surface: 'rgba(168, 85, 247, 0.12)',
        particle: '#A855F7',
        glow: 'rgba(168, 85, 247, 0.2)',
      },
    },
    pattern: 'cosmic',
    animationSpeed: 'medium',
    particleType: 'celebration',
    hasGlow: true,
  },
  learning: {
    id: 'learning',
    name: 'Study Mode',
    description: 'Focused gradient optimized for learning',
    isPremium: false,
    colors: {
      dark: {
        primary: '#0F172A',
        secondary: '#1E293B',
        accent: '#38BDF8',
        surface: 'rgba(56, 189, 248, 0.12)',
        particle: '#7DD3FC',
        glow: 'rgba(125, 211, 252, 0.25)',
      },
      light: {
        primary: '#F8FAFC',
        secondary: '#F1F5F9',
        accent: '#0EA5E9',
        surface: 'rgba(14, 165, 233, 0.1)',
        particle: '#0EA5E9',
        glow: 'rgba(14, 165, 233, 0.15)',
      },
    },
    pattern: 'waves',
    animationSpeed: 'slow',
    particleType: 'ambient',
    hasGlow: true,
  },
};

export const SCREEN_THEME_MAP: Record<string, BackgroundThemeId> = {
  index: 'default',
  fever: 'fever',
  wellness: 'zen',
  eco: 'eco',
  tournaments: 'playful',
  campaign: 'cosmic',
  profile: 'default',
  duels: 'neon',
  events: 'sunset',
  shop: 'neon',
  playlists: 'playful',
  leaderboard: 'aurora',
  stats: 'default',
  learning: 'learning',
  daily: 'default',
};

export const getThemeForScreen = (screenName: string): BackgroundThemeId => {
  return SCREEN_THEME_MAP[screenName] || 'default';
};

export const PREMIUM_THEMES: BackgroundThemeId[] = ['neon', 'aurora', 'sunset', 'ocean', 'cosmic'];

export const getParticleColors = (theme: BackgroundThemeId, isDark: boolean): string[] => {
  const themeConfig = BACKGROUND_THEMES[theme];
  const colors = isDark ? themeConfig.colors.dark : themeConfig.colors.light;
  return [colors.particle, colors.accent, colors.glow.replace(/rgba?\([^)]+,\s*[\d.]+\)/, colors.accent)];
};
