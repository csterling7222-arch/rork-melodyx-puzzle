import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getAdaptiveSettings } from './errorTracking';

export type HapticPattern = 
  | 'tap' | 'doubleTap' | 'success' | 'warning' | 'error'
  | 'notePlay' | 'noteCorrect' | 'noteWrong' | 'noteClose'
  | 'submit' | 'win' | 'lose' | 'streak' | 'combo'
  | 'unlock' | 'purchase' | 'levelUp' | 'achievement'
  | 'buttonPress' | 'toggle' | 'swipe' | 'drag'
  | 'countdown' | 'timer' | 'pulse';

interface HapticConfig {
  enabled: boolean;
  intensity: 'off' | 'low' | 'high';
  reducedForLowPerformance: boolean;
}

const defaultConfig: HapticConfig = {
  enabled: true,
  intensity: 'high',
  reducedForLowPerformance: true,
};

let currentConfig: HapticConfig = { ...defaultConfig };

export function configureHaptics(config: Partial<HapticConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  console.log('[HapticEngine] Config updated:', currentConfig);
}

function shouldPlayHaptic(): boolean {
  if (Platform.OS === 'web') return false;
  if (!currentConfig.enabled) return false;
  if (currentConfig.intensity === 'off') return false;
  
  if (currentConfig.reducedForLowPerformance) {
    const settings = getAdaptiveSettings();
    if (settings.hapticIntensity === 'off') return false;
  }
  
  return true;
}

function getImpactStyle(): Haptics.ImpactFeedbackStyle {
  if (currentConfig.intensity === 'low') {
    return Haptics.ImpactFeedbackStyle.Light;
  }
  return Haptics.ImpactFeedbackStyle.Medium;
}

export async function playHaptic(pattern: HapticPattern): Promise<void> {
  if (!shouldPlayHaptic()) return;
  
  try {
    switch (pattern) {
      case 'tap':
      case 'buttonPress':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
        
      case 'doubleTap':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 80);
        break;
        
      case 'success':
      case 'win':
      case 'unlock':
      case 'achievement':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
        
      case 'warning':
      case 'noteClose':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
        
      case 'error':
      case 'lose':
      case 'noteWrong':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
        
      case 'notePlay':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
        
      case 'noteCorrect':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
        
      case 'submit':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
        
      case 'streak':
      case 'combo':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
        break;
        
      case 'purchase':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
        break;
        
      case 'levelUp':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
        }, 200);
        break;
        
      case 'toggle':
        await Haptics.selectionAsync();
        break;
        
      case 'swipe':
      case 'drag':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
        
      case 'countdown':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
        
      case 'timer':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
        
      case 'pulse':
        await Haptics.impactAsync(getImpactStyle());
        break;
        
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    console.log('[HapticEngine] Haptic error:', error);
  }
}

export async function playHapticSequence(patterns: HapticPattern[], delayMs: number = 100): Promise<void> {
  if (!shouldPlayHaptic()) return;
  
  for (let i = 0; i < patterns.length; i++) {
    await playHaptic(patterns[i]);
    if (i < patterns.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

export async function playWinCelebration(): Promise<void> {
  if (!shouldPlayHaptic()) return;
  
  await playHapticSequence(['success', 'streak', 'achievement'], 150);
}

export async function playLoseFeedback(): Promise<void> {
  if (!shouldPlayHaptic()) return;
  
  await playHaptic('lose');
}

export async function playNoteAccuracyFeedback(accuracy: 'correct' | 'wrong' | 'close'): Promise<void> {
  switch (accuracy) {
    case 'correct':
      await playHaptic('noteCorrect');
      break;
    case 'wrong':
      await playHaptic('noteWrong');
      break;
    case 'close':
      await playHaptic('noteClose');
      break;
  }
}

export async function playComboFeedback(comboCount: number): Promise<void> {
  if (!shouldPlayHaptic()) return;
  
  if (comboCount >= 10) {
    await playHapticSequence(['combo', 'streak'], 80);
  } else if (comboCount >= 5) {
    await playHaptic('combo');
  } else if (comboCount >= 3) {
    await playHaptic('streak');
  }
}

export async function playCountdown(count: number): Promise<void> {
  if (!shouldPlayHaptic()) return;
  
  if (count === 0) {
    await playHaptic('success');
  } else {
    await playHaptic('countdown');
  }
}

export function isHapticEnabled(): boolean {
  return shouldPlayHaptic();
}

export function getHapticConfig(): HapticConfig {
  return { ...currentConfig };
}
