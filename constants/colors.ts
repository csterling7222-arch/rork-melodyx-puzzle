export const Colors = {
  background: '#0A0A0F',
  surface: '#14141F',
  surfaceLight: '#1E1E2D',
  surfaceHighlight: '#28283A',
  surfaceElevated: '#32324A',
  
  text: '#FFFFFF',
  textSecondary: '#A1A1B5',
  textMuted: '#6B6B80',
  textSubtle: '#4A4A5A',
  
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  
  secondary: '#06B6D4',
  secondaryLight: '#22D3EE',
  secondaryDark: '#0891B2',
  
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  
  border: '#2A2A3D',
  borderLight: '#3A3A50',
  divider: '#1F1F2E',
  
  correct: '#22C55E',
  correctLight: '#4ADE80',
  correctDark: '#16A34A',
  
  present: '#EAB308',
  presentLight: '#FACC15',
  presentDark: '#CA8A04',
  
  absent: '#374151',
  absentLight: '#4B5563',
  absentDark: '#1F2937',
  
  accent: '#8B5CF6',
  accentLight: '#A78BFA',
  accentDark: '#6D28D9',
  
  fever: '#FF6B35',
  feverLight: '#FF8F66',
  feverDark: '#E55A2B',
  feverGlow: 'rgba(255, 107, 53, 0.4)',
  
  zen: '#A78BFA',
  zenLight: '#C4B5FD',
  zenDark: '#7C3AED',
  zenGlow: 'rgba(167, 139, 250, 0.3)',
  
  eco: '#34D399',
  ecoLight: '#6EE7B7',
  ecoDark: '#059669',
  ecoGlow: 'rgba(52, 211, 153, 0.3)',
  
  learning: '#38BDF8',
  learningLight: '#7DD3FC',
  learningDark: '#0284C7',
  learningGlow: 'rgba(56, 189, 248, 0.3)',
  
  keyWhite: '#FAFAFA',
  keyWhitePressed: '#E5E5E5',
  keyBlack: '#1A1A1A',
  keyBlackPressed: '#2A2A2A',
  keyBorder: '#3A3A3A',
  keyGlow: 'rgba(139, 92, 246, 0.5)',
  
  piano: {
    C: '#EF4444',
    'C#': '#1F1F1F',
    D: '#F97316',
    'D#': '#1F1F1F',
    E: '#EAB308',
    F: '#22C55E',
    'F#': '#1F1F1F',
    G: '#06B6D4',
    'G#': '#1F1F1F',
    A: '#3B82F6',
    'A#': '#1F1F1F',
    B: '#A855F7',
  } as Record<string, string>,
  
  pianoText: {
    C: '#FFFFFF',
    'C#': '#FFFFFF',
    D: '#FFFFFF',
    'D#': '#FFFFFF',
    E: '#1F1F1F',
    F: '#FFFFFF',
    'F#': '#FFFFFF',
    G: '#1F1F1F',
    'G#': '#FFFFFF',
    A: '#FFFFFF',
    'A#': '#FFFFFF',
    B: '#FFFFFF',
  } as Record<string, string>,

  instrument: {
    piano: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      glow: 'rgba(139, 92, 246, 0.4)',
    },
    guitar: {
      primary: '#F97316',
      secondary: '#FB923C',
      glow: 'rgba(249, 115, 22, 0.4)',
    },
    bass: {
      primary: '#06B6D4',
      secondary: '#22D3EE',
      glow: 'rgba(6, 182, 212, 0.4)',
    },
    drums: {
      primary: '#EF4444',
      secondary: '#F87171',
      glow: 'rgba(239, 68, 68, 0.4)',
    },
    keyboard: {
      primary: '#10B981',
      secondary: '#34D399',
      glow: 'rgba(16, 185, 129, 0.4)',
    },
  },

  gradient: {
    primary: ['#8B5CF6', '#6366F1'],
    secondary: ['#06B6D4', '#0EA5E9'],
    success: ['#22C55E', '#10B981'],
    warning: ['#F59E0B', '#EAB308'],
    fever: ['#FF6B35', '#F97316'],
    zen: ['#A78BFA', '#8B5CF6'],
    eco: ['#34D399', '#22C55E'],
    dark: ['#0A0A0F', '#14141F'],
    surface: ['#14141F', '#1E1E2D'],
  },

  overlay: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(0, 0, 0, 0.5)',
    darker: 'rgba(0, 0, 0, 0.7)',
    accent: 'rgba(139, 92, 246, 0.15)',
  },
  
  shadow: {
    small: 'rgba(0, 0, 0, 0.15)',
    medium: 'rgba(0, 0, 0, 0.25)',
    large: 'rgba(0, 0, 0, 0.35)',
    glow: 'rgba(139, 92, 246, 0.3)',
  },
};

export const DarkColors = Colors;

export const LightColors = {
  ...Colors,
  background: '#F8F6F4',
  surface: '#FFFFFF',
  surfaceLight: '#F2EFE9',
  surfaceHighlight: '#E8E4DC',
  surfaceElevated: '#FFFFFF',
  
  text: '#1C1917',
  textSecondary: '#44403C',
  textMuted: '#78716C',
  textSubtle: '#A8A29E',
  
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primaryDark: '#6D28D9',
  
  secondary: '#0891B2',
  secondaryLight: '#06B6D4',
  secondaryDark: '#0E7490',
  
  warning: '#D97706',
  warningLight: '#F59E0B',
  error: '#DC2626',
  errorLight: '#EF4444',
  
  border: '#E7E5E4',
  borderLight: '#D6D3D1',
  divider: '#F5F5F4',
  
  correct: '#16A34A',
  correctLight: '#22C55E',
  correctDark: '#15803D',
  
  present: '#CA8A04',
  presentLight: '#EAB308',
  presentDark: '#A16207',
  
  absent: '#D6D3D1',
  absentLight: '#E7E5E4',
  absentDark: '#A8A29E',
  
  accent: '#7C3AED',
  accentLight: '#8B5CF6',
  accentDark: '#6D28D9',
  
  fever: '#EA580C',
  feverLight: '#F97316',
  feverDark: '#C2410C',
  feverGlow: 'rgba(234, 88, 12, 0.25)',
  
  zen: '#7C3AED',
  zenLight: '#8B5CF6',
  zenDark: '#6D28D9',
  zenGlow: 'rgba(124, 58, 237, 0.2)',
  
  eco: '#059669',
  ecoLight: '#10B981',
  ecoDark: '#047857',
  ecoGlow: 'rgba(5, 150, 105, 0.2)',
  
  learning: '#0284C7',
  learningLight: '#0EA5E9',
  learningDark: '#0369A1',
  learningGlow: 'rgba(2, 132, 199, 0.2)',
  
  keyWhite: '#FFFFFF',
  keyWhitePressed: '#F5F5F4',
  keyBlack: '#292524',
  keyBlackPressed: '#44403C',
  keyBorder: '#D6D3D1',
  keyGlow: 'rgba(124, 58, 237, 0.35)',
  
  piano: {
    C: '#DC2626',
    'C#': '#292524',
    D: '#EA580C',
    'D#': '#292524',
    E: '#CA8A04',
    F: '#16A34A',
    'F#': '#292524',
    G: '#0891B2',
    'G#': '#292524',
    A: '#2563EB',
    'A#': '#292524',
    B: '#7C3AED',
  } as Record<string, string>,
  
  pianoText: {
    C: '#FFFFFF',
    'C#': '#FFFFFF',
    D: '#FFFFFF',
    'D#': '#FFFFFF',
    E: '#1C1917',
    F: '#FFFFFF',
    'F#': '#FFFFFF',
    G: '#FFFFFF',
    'G#': '#FFFFFF',
    A: '#FFFFFF',
    'A#': '#FFFFFF',
    B: '#FFFFFF',
  } as Record<string, string>,
  
  gradient: {
    primary: ['#7C3AED', '#6366F1'],
    secondary: ['#0891B2', '#0EA5E9'],
    success: ['#16A34A', '#059669'],
    warning: ['#D97706', '#CA8A04'],
    fever: ['#EA580C', '#DC2626'],
    zen: ['#8B5CF6', '#7C3AED'],
    eco: ['#10B981', '#059669'],
    dark: ['#F8F6F4', '#F2EFE9'],
    surface: ['#FFFFFF', '#F8F6F4'],
  },
  
  overlay: {
    light: 'rgba(28, 25, 23, 0.03)',
    medium: 'rgba(28, 25, 23, 0.06)',
    dark: 'rgba(28, 25, 23, 0.4)',
    darker: 'rgba(28, 25, 23, 0.6)',
    accent: 'rgba(124, 58, 237, 0.08)',
  },
  
  shadow: {
    small: 'rgba(28, 25, 23, 0.06)',
    medium: 'rgba(28, 25, 23, 0.1)',
    large: 'rgba(28, 25, 23, 0.15)',
    glow: 'rgba(124, 58, 237, 0.15)',
  },
  
  instrument: {
    piano: {
      primary: '#7C3AED',
      secondary: '#8B5CF6',
      glow: 'rgba(124, 58, 237, 0.25)',
    },
    guitar: {
      primary: '#EA580C',
      secondary: '#F97316',
      glow: 'rgba(234, 88, 12, 0.25)',
    },
    bass: {
      primary: '#0891B2',
      secondary: '#06B6D4',
      glow: 'rgba(8, 145, 178, 0.25)',
    },
    drums: {
      primary: '#DC2626',
      secondary: '#EF4444',
      glow: 'rgba(220, 38, 38, 0.25)',
    },
    keyboard: {
      primary: '#059669',
      secondary: '#10B981',
      glow: 'rgba(5, 150, 105, 0.25)',
    },
  },
};

export default Colors;
