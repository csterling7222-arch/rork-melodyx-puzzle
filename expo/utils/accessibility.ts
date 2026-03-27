import { Platform, AccessibilityInfo, PixelRatio, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESSIBILITY_SETTINGS_KEY = 'melodyx_accessibility_settings';

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  screenReaderEnabled: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  hapticFeedback: boolean;
  textScaleFactor: number;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  screenReaderEnabled: false,
  colorBlindMode: 'none',
  hapticFeedback: true,
  textScaleFactor: 1.0,
};

let currentSettings: AccessibilitySettings = { ...DEFAULT_SETTINGS };
let listeners: ((settings: AccessibilitySettings) => void)[] = [];

export async function initAccessibility(): Promise<AccessibilitySettings> {
  try {
    const stored = await AsyncStorage.getItem(ACCESSIBILITY_SETTINGS_KEY);
    if (stored) {
      currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }

    if (Platform.OS !== 'web') {
      const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      
      currentSettings.screenReaderEnabled = isScreenReaderEnabled;
      currentSettings.reducedMotion = isReduceMotionEnabled;

      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        currentSettings.screenReaderEnabled = enabled;
        notifyListeners();
      });

      AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
        currentSettings.reducedMotion = enabled;
        notifyListeners();
      });
    }

    const fontScale = PixelRatio.getFontScale();
    if (fontScale > 1.2) {
      currentSettings.largeText = true;
      currentSettings.textScaleFactor = Math.min(fontScale, 1.5);
    }

    console.log('[Accessibility] Initialized:', currentSettings);
    return currentSettings;
  } catch (error) {
    console.log('[Accessibility] Init error:', error);
    return DEFAULT_SETTINGS;
  }
}

function notifyListeners() {
  listeners.forEach(listener => listener(currentSettings));
}

export function addAccessibilityListener(listener: (settings: AccessibilitySettings) => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export async function updateAccessibilitySettings(updates: Partial<AccessibilitySettings>): Promise<void> {
  currentSettings = { ...currentSettings, ...updates };
  await AsyncStorage.setItem(ACCESSIBILITY_SETTINGS_KEY, JSON.stringify(currentSettings));
  notifyListeners();
  console.log('[Accessibility] Settings updated:', currentSettings);
}

export function getAccessibilitySettings(): AccessibilitySettings {
  return { ...currentSettings };
}

export function getScaledFontSize(baseSize: number): number {
  const scaleFactor = currentSettings.textScaleFactor;
  const largeTextBonus = currentSettings.largeText ? 2 : 0;
  return Math.round((baseSize + largeTextBonus) * scaleFactor);
}

export function getMinTouchTarget(): number {
  return currentSettings.largeText ? 52 : 44;
}

export interface ColorBlindColors {
  correct: string;
  wrong: string;
  present: string;
  accent: string;
  warning: string;
}

const STANDARD_COLORS: ColorBlindColors = {
  correct: '#22C55E',
  wrong: '#EF4444',
  present: '#F59E0B',
  accent: '#8B5CF6',
  warning: '#F97316',
};

const PROTANOPIA_COLORS: ColorBlindColors = {
  correct: '#0EA5E9',
  wrong: '#6366F1',
  present: '#FACC15',
  accent: '#EC4899',
  warning: '#F59E0B',
};

const DEUTERANOPIA_COLORS: ColorBlindColors = {
  correct: '#0EA5E9',
  wrong: '#A855F7',
  present: '#FACC15',
  accent: '#F43F5E',
  warning: '#FB923C',
};

const TRITANOPIA_COLORS: ColorBlindColors = {
  correct: '#10B981',
  wrong: '#F43F5E',
  present: '#14B8A6',
  accent: '#8B5CF6',
  warning: '#F97316',
};

export function getColorBlindColors(): ColorBlindColors {
  switch (currentSettings.colorBlindMode) {
    case 'protanopia':
      return PROTANOPIA_COLORS;
    case 'deuteranopia':
      return DEUTERANOPIA_COLORS;
    case 'tritanopia':
      return TRITANOPIA_COLORS;
    default:
      return STANDARD_COLORS;
  }
}

export function getContrastColor(backgroundColor: string): string {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export function getHighContrastColors() {
  if (!currentSettings.highContrast) {
    return null;
  }
  
  return {
    background: '#000000',
    surface: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#E5E5E5',
    border: '#FFFFFF',
    accent: '#FFFF00',
    correct: '#00FF00',
    wrong: '#FF0000',
  };
}

export function shouldReduceMotion(): boolean {
  return currentSettings.reducedMotion;
}

export function shouldEnableHaptics(): boolean {
  return currentSettings.hapticFeedback && Platform.OS !== 'web';
}

export function isScreenReaderActive(): boolean {
  return currentSettings.screenReaderEnabled;
}

export function getAccessibilityLabel(
  primaryLabel: string,
  hint?: string,
  state?: { disabled?: boolean; selected?: boolean; checked?: boolean }
): { accessibilityLabel: string; accessibilityHint?: string; accessibilityState?: object } {
  const stateDescriptions: string[] = [];
  
  if (state?.disabled) stateDescriptions.push('disabled');
  if (state?.selected) stateDescriptions.push('selected');
  if (state?.checked !== undefined) {
    stateDescriptions.push(state.checked ? 'checked' : 'unchecked');
  }
  
  const fullLabel = stateDescriptions.length > 0
    ? `${primaryLabel}, ${stateDescriptions.join(', ')}`
    : primaryLabel;

  return {
    accessibilityLabel: fullLabel,
    accessibilityHint: hint,
    accessibilityState: state ? {
      disabled: state.disabled,
      selected: state.selected,
      checked: state.checked,
    } : undefined,
  };
}

export function announceForAccessibility(message: string): void {
  if (Platform.OS !== 'web') {
    AccessibilityInfo.announceForAccessibility(message);
  }
}

export function getAnimationDuration(baseDuration: number): number {
  if (currentSettings.reducedMotion) {
    return Math.min(baseDuration * 0.3, 150);
  }
  return baseDuration;
}

export function getResponsiveSpacing(baseSpacing: number): number {
  const { width } = Dimensions.get('window');
  const isSmallDevice = width < 375;
  const isLargeDevice = width > 428;
  
  if (isSmallDevice) return Math.round(baseSpacing * 0.85);
  if (isLargeDevice) return Math.round(baseSpacing * 1.1);
  return baseSpacing;
}

export const AccessibilityRoles = {
  BUTTON: 'button' as const,
  LINK: 'link' as const,
  IMAGE: 'image' as const,
  TEXT: 'text' as const,
  HEADER: 'header' as const,
  SEARCH: 'search' as const,
  SWITCH: 'switch' as const,
  SLIDER: 'adjustable' as const,
  CHECKBOX: 'checkbox' as const,
  RADIO: 'radio' as const,
  TAB: 'tab' as const,
  TABLIST: 'tablist' as const,
  MENU: 'menu' as const,
  MENUITEM: 'menuitem' as const,
  PROGRESSBAR: 'progressbar' as const,
  ALERT: 'alert' as const,
  NONE: 'none' as const,
};

export function createAccessibleTouchable(props: {
  label: string;
  hint?: string;
  role?: keyof typeof AccessibilityRoles;
  disabled?: boolean;
  selected?: boolean;
  onPress?: () => void;
}) {
  return {
    accessible: true,
    accessibilityLabel: props.label,
    accessibilityHint: props.hint,
    accessibilityRole: props.role ? AccessibilityRoles[props.role] : AccessibilityRoles.BUTTON,
    accessibilityState: {
      disabled: props.disabled,
      selected: props.selected,
    },
    hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  };
}
