import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const lastHapticTimes = new Map<string, number>();
const DEFAULT_DEBOUNCE_MS = 100;
const NOTIFICATION_DEBOUNCE_MS = 300;
const SELECTION_DEBOUNCE_MS = 50;

type HapticType = 'impact' | 'notification' | 'selection';

interface HapticOptions {
  debounceMs?: number;
  force?: boolean;
}

function shouldTriggerHaptic(
  key: string,
  debounceMs: number,
  force?: boolean
): boolean {
  if (Platform.OS === 'web') return false;
  if (force) return true;
  
  const lastTime = lastHapticTimes.get(key) ?? 0;
  const now = Date.now();
  
  if (now - lastTime < debounceMs) {
    return false;
  }
  
  lastHapticTimes.set(key, now);
  return true;
}

export async function debouncedImpact(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium,
  options?: HapticOptions
): Promise<void> {
  const key = `impact_${style}`;
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  
  if (!shouldTriggerHaptic(key, debounceMs, options?.force)) {
    return;
  }
  
  try {
    await Haptics.impactAsync(style);
  } catch (error) {
    console.log('[Haptics] Impact error:', error);
  }
}

export async function debouncedNotification(
  type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success,
  options?: HapticOptions
): Promise<void> {
  const key = `notification_${type}`;
  const debounceMs = options?.debounceMs ?? NOTIFICATION_DEBOUNCE_MS;
  
  if (!shouldTriggerHaptic(key, debounceMs, options?.force)) {
    return;
  }
  
  try {
    await Haptics.notificationAsync(type);
  } catch (error) {
    console.log('[Haptics] Notification error:', error);
  }
}

export async function debouncedSelection(options?: HapticOptions): Promise<void> {
  const key = 'selection';
  const debounceMs = options?.debounceMs ?? SELECTION_DEBOUNCE_MS;
  
  if (!shouldTriggerHaptic(key, debounceMs, options?.force)) {
    return;
  }
  
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.log('[Haptics] Selection error:', error);
  }
}

export function createHapticHandler(
  type: HapticType,
  style?: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType,
  debounceMs?: number
): () => void {
  return () => {
    switch (type) {
      case 'impact':
        debouncedImpact(
          style as Haptics.ImpactFeedbackStyle ?? Haptics.ImpactFeedbackStyle.Light,
          { debounceMs }
        );
        break;
      case 'notification':
        debouncedNotification(
          style as Haptics.NotificationFeedbackType ?? Haptics.NotificationFeedbackType.Success,
          { debounceMs }
        );
        break;
      case 'selection':
        debouncedSelection({ debounceMs });
        break;
    }
  };
}

export function clearHapticDebounce(): void {
  lastHapticTimes.clear();
}

const animationDebounce = new Map<string, number>();
const ANIMATION_DEBOUNCE_MS = 150;

export function shouldTriggerAnimation(key: string, debounceMs: number = ANIMATION_DEBOUNCE_MS): boolean {
  const lastTime = animationDebounce.get(key) ?? 0;
  const now = Date.now();
  
  if (now - lastTime < debounceMs) {
    return false;
  }
  
  animationDebounce.set(key, now);
  return true;
}

export function clearAnimationDebounce(): void {
  animationDebounce.clear();
}
