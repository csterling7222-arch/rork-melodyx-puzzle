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
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceLight: '#F5F5F5',
  surfaceHighlight: '#EEEEEE',
  surfaceElevated: '#FFFFFF',
  
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#6B6B6B',
  textSubtle: '#9A9A9A',
  
  border: '#E5E5E5',
  borderLight: '#D5D5D5',
  divider: '#EEEEEE',
  
  absent: '#D1D5DB',
  absentLight: '#E5E7EB',
  absentDark: '#9CA3AF',
  
  keyWhite: '#FFFFFF',
  keyWhitePressed: '#F5F5F5',
  keyBlack: '#1A1A1A',
  keyBlackPressed: '#2A2A2A',
  
  overlay: {
    light: 'rgba(0, 0, 0, 0.02)',
    medium: 'rgba(0, 0, 0, 0.05)',
    dark: 'rgba(0, 0, 0, 0.3)',
    darker: 'rgba(0, 0, 0, 0.5)',
    accent: 'rgba(139, 92, 246, 0.1)',
  },
  
  shadow: {
    small: 'rgba(0, 0, 0, 0.08)',
    medium: 'rgba(0, 0, 0, 0.12)',
    large: 'rgba(0, 0, 0, 0.18)',
    glow: 'rgba(139, 92, 246, 0.2)',
  },
};

export default Colors;
