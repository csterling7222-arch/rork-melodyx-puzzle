export interface AccessibilitySettings {
  hapticFeedback: boolean;
  voiceoverEnabled: boolean;
  highContrast: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  largeText: boolean;
  reduceMotion: boolean;
  screenReaderHints: boolean;
  hapticNotes: boolean;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  hapticFeedback: true,
  voiceoverEnabled: false,
  highContrast: false,
  colorBlindMode: 'none',
  largeText: false,
  reduceMotion: false,
  screenReaderHints: true,
  hapticNotes: false,
};

export const COLOR_BLIND_PALETTES: Record<string, Record<string, string>> = {
  none: {
    correct: '#22C55E',
    present: '#EAB308',
    absent: '#374151',
  },
  protanopia: {
    correct: '#0EA5E9',
    present: '#F59E0B',
    absent: '#6B7280',
  },
  deuteranopia: {
    correct: '#3B82F6',
    present: '#F97316',
    absent: '#6B7280',
  },
  tritanopia: {
    correct: '#EC4899',
    present: '#06B6D4',
    absent: '#6B7280',
  },
};

export const HIGH_CONTRAST_COLORS = {
  background: '#000000',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  accent: '#FFFF00',
  correct: '#00FF00',
  present: '#FFFF00',
  absent: '#808080',
};

export const NOTE_HAPTIC_PATTERNS: Record<string, number[]> = {
  'C': [100],
  'C#': [50, 50],
  'D': [100, 50],
  'D#': [50, 50, 50],
  'E': [150],
  'F': [100, 100],
  'F#': [50, 100],
  'G': [150, 50],
  'G#': [50, 50, 100],
  'A': [200],
  'A#': [100, 50, 50],
  'B': [200, 50],
};

export const VOICEOVER_LABELS = {
  keyboard: {
    note: (note: string) => `Piano key ${note}`,
    submit: 'Submit your guess',
    delete: 'Delete last note',
  },
  grid: {
    empty: 'Empty cell',
    correct: (note: string) => `${note}, correct position`,
    present: (note: string) => `${note}, wrong position`,
    absent: (note: string) => `${note}, not in melody`,
  },
  game: {
    win: (attempts: number) => `Congratulations! You solved it in ${attempts} attempts`,
    lose: 'Game over. Better luck next time!',
    streak: (days: number) => `Current streak: ${days} days`,
  },
};

export function getAccessibleColor(
  colorKey: 'correct' | 'present' | 'absent',
  settings: AccessibilitySettings
): string {
  if (settings.highContrast) {
    return HIGH_CONTRAST_COLORS[colorKey];
  }
  if (settings.colorBlindMode !== 'none') {
    return COLOR_BLIND_PALETTES[settings.colorBlindMode][colorKey];
  }
  return COLOR_BLIND_PALETTES.none[colorKey];
}

export function getFontScale(largeText: boolean): number {
  return largeText ? 1.25 : 1;
}
