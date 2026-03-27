import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export interface DimensionsState {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  scale: number;
  fontScale: number;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  safeWidth: number;
  safeHeight: number;
}

const SMALL_SCREEN_WIDTH = 375;
const MEDIUM_SCREEN_WIDTH = 414;

function getDimensionsState(window: ScaledSize, screen: ScaledSize): DimensionsState {
  const { width, height, scale, fontScale } = window;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;
  
  const safeWidth = Math.min(width, screen.width);
  const safeHeight = Math.min(height, screen.height);
  
  return {
    width,
    height,
    isLandscape,
    isPortrait,
    scale,
    fontScale,
    isSmallScreen: width <= SMALL_SCREEN_WIDTH,
    isMediumScreen: width > SMALL_SCREEN_WIDTH && width <= MEDIUM_SCREEN_WIDTH,
    isLargeScreen: width > MEDIUM_SCREEN_WIDTH,
    safeWidth,
    safeHeight,
  };
}

export function useDimensions(): DimensionsState {
  const [dimensions, setDimensions] = useState<DimensionsState>(() => {
    const window = Dimensions.get('window');
    const screen = Dimensions.get('screen');
    return getDimensionsState(window, screen);
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      const newState = getDimensionsState(window, screen);
      setDimensions(prev => {
        if (
          prev.width === newState.width &&
          prev.height === newState.height &&
          prev.isLandscape === newState.isLandscape
        ) {
          return prev;
        }
        console.log('[useDimensions] Screen changed:', {
          width: newState.width,
          height: newState.height,
          isLandscape: newState.isLandscape,
        });
        return newState;
      });
    });

    return () => subscription.remove();
  }, []);

  return dimensions;
}

export function useResponsiveValue<T>(
  values: { small: T; medium: T; large: T },
  defaultValue?: T
): T {
  const { isSmallScreen, isMediumScreen, isLargeScreen } = useDimensions();
  
  if (isSmallScreen) return values.small;
  if (isMediumScreen) return values.medium;
  if (isLargeScreen) return values.large;
  return defaultValue ?? values.medium;
}

export function useOrientationLock(lockTo?: 'portrait' | 'landscape'): {
  isLocked: boolean;
  currentOrientation: 'portrait' | 'landscape';
} {
  const { isLandscape } = useDimensions();
  const currentOrientation = isLandscape ? 'landscape' : 'portrait';
  
  return {
    isLocked: lockTo !== undefined,
    currentOrientation,
  };
}

export function getScaledSize(baseSize: number, dimensions: DimensionsState): number {
  const scaleFactor = dimensions.width / 375;
  return Math.round(baseSize * Math.min(scaleFactor, 1.3));
}

export function getAdaptiveColumns(
  dimensions: DimensionsState,
  minItemWidth: number,
  maxColumns: number = 6
): number {
  const availableWidth = dimensions.width - 32;
  const columns = Math.floor(availableWidth / minItemWidth);
  return Math.min(Math.max(columns, 1), maxColumns);
}
