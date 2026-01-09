import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { BackgroundThemeId, BACKGROUND_THEMES, getThemeForScreen } from '@/constants/backgrounds';

interface ThemeSettings {
  isDarkMode: boolean;
  backgroundTheme: BackgroundThemeId;
  customScreenThemes: Record<string, BackgroundThemeId>;
  animationsEnabled: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

const STORAGE_KEY = 'melodyx_theme_settings';

const DEFAULT_SETTINGS: ThemeSettings = {
  isDarkMode: true,
  backgroundTheme: 'default',
  customScreenThemes: {},
  animationsEnabled: true,
  highContrast: false,
  reducedMotion: false,
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentScreen, setCurrentScreen] = useState<string>('index');

  const settingsQuery = useQuery({
    queryKey: ['themeSettings'],
    queryFn: async (): Promise<ThemeSettings> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
      } catch (error) {
        console.log('Error loading theme settings:', error);
      }
      return DEFAULT_SETTINGS;
    },
  });

  const { mutate: saveSettings } = useMutation({
    mutationFn: async (settings: ThemeSettings) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themeSettings'] });
    },
  });

  const settings = settingsQuery.data ?? DEFAULT_SETTINGS;

  const setDarkMode = useCallback((isDark: boolean) => {
    const newSettings = { ...settings, isDarkMode: isDark };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const setBackgroundTheme = useCallback((theme: BackgroundThemeId) => {
    const newSettings = { ...settings, backgroundTheme: theme };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const setScreenTheme = useCallback((screen: string, theme: BackgroundThemeId) => {
    const newSettings = {
      ...settings,
      customScreenThemes: {
        ...settings.customScreenThemes,
        [screen]: theme,
      },
    };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const toggleAnimations = useCallback(() => {
    const newSettings = { ...settings, animationsEnabled: !settings.animationsEnabled };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const toggleHighContrast = useCallback(() => {
    const newSettings = { ...settings, highContrast: !settings.highContrast };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const toggleReducedMotion = useCallback(() => {
    const newSettings = { ...settings, reducedMotion: !settings.reducedMotion };
    saveSettings(newSettings);
  }, [settings, saveSettings]);

  const getThemeForCurrentScreen = useCallback((): BackgroundThemeId => {
    if (settings.customScreenThemes[currentScreen]) {
      return settings.customScreenThemes[currentScreen];
    }
    return getThemeForScreen(currentScreen);
  }, [currentScreen, settings.customScreenThemes]);

  const resetToDefaults = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  const getAvailableThemes = useCallback(() => {
    return Object.values(BACKGROUND_THEMES);
  }, []);

  return {
    isDarkMode: settings.isDarkMode,
    backgroundTheme: settings.backgroundTheme,
    customScreenThemes: settings.customScreenThemes,
    animationsEnabled: settings.animationsEnabled && !settings.reducedMotion,
    highContrast: settings.highContrast,
    reducedMotion: settings.reducedMotion,
    currentScreen,
    isLoading: settingsQuery.isLoading,
    setDarkMode,
    setBackgroundTheme,
    setScreenTheme,
    setCurrentScreen,
    toggleAnimations,
    toggleHighContrast,
    toggleReducedMotion,
    getThemeForCurrentScreen,
    resetToDefaults,
    getAvailableThemes,
  };
});

export function useScreenTheme(screenName: string) {
  const { customScreenThemes, isDarkMode, animationsEnabled, highContrast, setCurrentScreen } = useTheme();
  
  useEffect(() => {
    setCurrentScreen(screenName);
  }, [screenName, setCurrentScreen]);

  const theme = customScreenThemes[screenName] || getThemeForScreen(screenName);
  
  return {
    theme,
    isDarkMode,
    animationsEnabled,
    highContrast,
  };
}
