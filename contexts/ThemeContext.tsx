import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Appearance } from 'react-native';
import { BackgroundThemeId, BACKGROUND_THEMES, getThemeForScreen } from '@/constants/backgrounds';
import { addBreadcrumb } from '@/utils/errorTracking';

interface ThemeSettings {
  isDarkMode: boolean;
  backgroundTheme: BackgroundThemeId;
  customScreenThemes: Record<string, BackgroundThemeId>;
  animationsEnabled: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  autoSwitchEnabled: boolean;
  scheduledDarkMode: boolean;
  darkModeStartHour: number;
  darkModeEndHour: number;
}

const STORAGE_KEY = 'melodyx_theme_settings';

const DEFAULT_SETTINGS: ThemeSettings = {
  isDarkMode: true,
  backgroundTheme: 'default',
  customScreenThemes: {},
  animationsEnabled: true,
  highContrast: false,
  reducedMotion: false,
  autoSwitchEnabled: true,
  scheduledDarkMode: false,
  darkModeStartHour: 19,
  darkModeEndHour: 7,
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentScreen, setCurrentScreen] = useState<string>('index');
  const [systemColorScheme, setSystemColorScheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() || 'dark'
  );
  const scheduleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('[Theme] System color scheme changed:', colorScheme);
      setSystemColorScheme(colorScheme || 'dark');
      addBreadcrumb({ category: 'theme', message: `System theme: ${colorScheme}`, level: 'info' });
    });
    
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (settings.scheduledDarkMode) {
      const checkSchedule = () => {
        const hour = new Date().getHours();
        const shouldBeDark = settings.darkModeStartHour > settings.darkModeEndHour
          ? hour >= settings.darkModeStartHour || hour < settings.darkModeEndHour
          : hour >= settings.darkModeStartHour && hour < settings.darkModeEndHour;
        
        if (shouldBeDark !== settings.isDarkMode) {
          const newSettings = { ...settings, isDarkMode: shouldBeDark };
          saveSettings(newSettings);
          console.log('[Theme] Scheduled mode switch:', shouldBeDark ? 'dark' : 'light');
        }
      };
      
      checkSchedule();
      scheduleCheckRef.current = setInterval(checkSchedule, 60000);
      
      return () => {
        if (scheduleCheckRef.current) {
          clearInterval(scheduleCheckRef.current);
        }
      };
    }
  }, [settings.scheduledDarkMode, settings.darkModeStartHour, settings.darkModeEndHour, settings.isDarkMode, settings, saveSettings]);

  const effectiveDarkMode = settings.autoSwitchEnabled && !settings.scheduledDarkMode
    ? systemColorScheme === 'dark'
    : settings.isDarkMode;

  const setDarkMode = useCallback((isDark: boolean) => {
    const newSettings = { ...settings, isDarkMode: isDark, autoSwitchEnabled: false };
    saveSettings(newSettings);
    console.log('[Theme] Manual dark mode set:', isDark);
  }, [settings, saveSettings]);

  const toggleAutoSwitch = useCallback(() => {
    const newAutoSwitch = !settings.autoSwitchEnabled;
    const newSettings = { 
      ...settings, 
      autoSwitchEnabled: newAutoSwitch,
      scheduledDarkMode: false,
    };
    saveSettings(newSettings);
    console.log('[Theme] Auto-switch:', newAutoSwitch ? 'enabled' : 'disabled');
  }, [settings, saveSettings]);

  const setScheduledDarkMode = useCallback((enabled: boolean, startHour?: number, endHour?: number) => {
    const newSettings = {
      ...settings,
      scheduledDarkMode: enabled,
      autoSwitchEnabled: false,
      darkModeStartHour: startHour ?? settings.darkModeStartHour,
      darkModeEndHour: endHour ?? settings.darkModeEndHour,
    };
    saveSettings(newSettings);
    console.log('[Theme] Scheduled dark mode:', enabled, startHour, '-', endHour);
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
    isDarkMode: effectiveDarkMode,
    backgroundTheme: settings.backgroundTheme,
    customScreenThemes: settings.customScreenThemes,
    animationsEnabled: settings.animationsEnabled && !settings.reducedMotion,
    highContrast: settings.highContrast,
    reducedMotion: settings.reducedMotion,
    autoSwitchEnabled: settings.autoSwitchEnabled,
    scheduledDarkMode: settings.scheduledDarkMode,
    darkModeStartHour: settings.darkModeStartHour,
    darkModeEndHour: settings.darkModeEndHour,
    systemColorScheme,
    currentScreen,
    isLoading: settingsQuery.isLoading,
    setDarkMode,
    toggleAutoSwitch,
    setScheduledDarkMode,
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
