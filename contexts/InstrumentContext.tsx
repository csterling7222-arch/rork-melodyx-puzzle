import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { 
  INSTRUMENTS, 
  Instrument, 
  DEFAULT_INSTRUMENT_ID, 
  WELLNESS_INSTRUMENT_ID,
  getInstrumentById,
  isInstrumentLocked,
  PREMIUM_INSTRUMENTS,
  EffectPreset,
  AITonePreset,
  UserPreset,
  InstrumentBundle,
  INSTRUMENT_BUNDLES,
  getEffectPresetById,
  getAITonePresetById,
  getInstrumentAIRecommendation,
} from '@/constants/instruments';
import { usePurchases, ENTITLEMENTS } from './PurchasesContext';

const STORAGE_KEY = 'melodyx_selected_instrument';
const TRIAL_STORAGE_KEY = 'melodyx_instrument_trial';
const EFFECTS_STORAGE_KEY = 'melodyx_instrument_effects';
const PRESETS_STORAGE_KEY = 'melodyx_user_presets';
const CACHE_STORAGE_KEY = 'melodyx_sound_cache_status';
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

interface InstrumentState {
  selectedId: string;
  wellnessOverride: boolean;
  selectedEffectId: string | null;
  selectedAIToneId: string | null;
}

interface TrialState {
  isActive: boolean;
  startedAt: string | null;
  instrumentId: string | null;
}

interface EffectSettings {
  [instrumentId: string]: {
    effectId: string;
    aiToneId: string | null;
    customizations: {
      reverb?: number;
      delay?: number;
      distortion?: number;
      chorus?: number;
      eq?: { bass: number; mid: number; treble: number };
    };
  };
}

interface SoundCacheStatus {
  [instrumentId: string]: {
    cached: boolean;
    cachedAt: string;
    soundBankId: string;
  };
}

interface AIRecommendation {
  instrumentId: string;
  effectId: string;
  reason: string;
}

export const [InstrumentProvider, useInstrument] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { isPremium, isDemoMode, hasEntitlement, isTrialActive: isPremiumTrialActive, trialDaysRemaining } = usePurchases();
  const [wellnessMode, setWellnessMode] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingInstrumentId, setPendingInstrumentId] = useState<string | null>(null);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [showAIRecommendation, setShowAIRecommendation] = useState(false);
  const [currentAIRecommendation, setCurrentAIRecommendation] = useState<AIRecommendation | null>(null);

  const instrumentQuery = useQuery({
    queryKey: ['selectedInstrument'],
    queryFn: async (): Promise<InstrumentState> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (isInstrumentLocked(parsed.selectedId, isPremium) && !isTrialActive(parsed.selectedId)) {
            return { selectedId: DEFAULT_INSTRUMENT_ID, wellnessOverride: false, selectedEffectId: null, selectedAIToneId: null };
          }
          return parsed;
        }
      } catch (error) {
        console.log('[Instrument] Error loading state:', error);
      }
      return { selectedId: DEFAULT_INSTRUMENT_ID, wellnessOverride: false, selectedEffectId: null, selectedAIToneId: null };
    },
  });

  const trialQuery = useQuery({
    queryKey: ['instrumentTrial'],
    queryFn: async (): Promise<TrialState> => {
      try {
        const stored = await AsyncStorage.getItem(TRIAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.startedAt) {
            const elapsed = Date.now() - new Date(parsed.startedAt).getTime();
            if (elapsed < TRIAL_DURATION_MS) {
              return { ...parsed, isActive: true };
            }
          }
          return { isActive: false, startedAt: null, instrumentId: null };
        }
      } catch (error) {
        console.log('[Instrument] Error loading trial:', error);
      }
      return { isActive: false, startedAt: null, instrumentId: null };
    },
  });

  const effectsQuery = useQuery({
    queryKey: ['instrumentEffects'],
    queryFn: async (): Promise<EffectSettings> => {
      try {
        const stored = await AsyncStorage.getItem(EFFECTS_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.log('[Instrument] Error loading effects:', error);
      }
      return {};
    },
  });

  const presetsQuery = useQuery({
    queryKey: ['userPresets'],
    queryFn: async (): Promise<UserPreset[]> => {
      try {
        const stored = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.log('[Instrument] Error loading presets:', error);
      }
      return [];
    },
  });

  const cacheStatusQuery = useQuery({
    queryKey: ['soundCacheStatus'],
    queryFn: async (): Promise<SoundCacheStatus> => {
      try {
        const stored = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.log('[Instrument] Error loading cache status:', error);
      }
      return {};
    },
  });

  const { mutate: saveTrial } = useMutation({
    mutationFn: async (trial: TrialState) => {
      await AsyncStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trial));
      return trial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instrumentTrial'] });
    },
  });

  const { mutate: saveEffects } = useMutation({
    mutationFn: async (effects: EffectSettings) => {
      await AsyncStorage.setItem(EFFECTS_STORAGE_KEY, JSON.stringify(effects));
      return effects;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instrumentEffects'] });
    },
  });

  const { mutate: savePresets } = useMutation({
    mutationFn: async (presets: UserPreset[]) => {
      await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
      return presets;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPresets'] });
    },
  });

  const { mutate: saveCacheStatus } = useMutation({
    mutationFn: async (status: SoundCacheStatus) => {
      await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(status));
      return status;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soundCacheStatus'] });
    },
  });

  const trialState = useMemo(() => 
    trialQuery.data ?? { isActive: false, startedAt: null, instrumentId: null }
  , [trialQuery.data]);

  const effectSettings = useMemo(() => effectsQuery.data ?? {}, [effectsQuery.data]);
  const userPresets = useMemo(() => presetsQuery.data ?? [], [presetsQuery.data]);
  const cacheStatus = useMemo(() => cacheStatusQuery.data ?? {}, [cacheStatusQuery.data]);

  const isTrialActive = useCallback((instrumentId: string): boolean => {
    if (!trialState.isActive || trialState.instrumentId !== instrumentId) return false;
    if (!trialState.startedAt) return false;
    const elapsed = Date.now() - new Date(trialState.startedAt).getTime();
    return elapsed < TRIAL_DURATION_MS;
  }, [trialState]);

  const trialTimeRemaining = useMemo(() => {
    if (!trialState.isActive || !trialState.startedAt) return 0;
    const elapsed = Date.now() - new Date(trialState.startedAt).getTime();
    return Math.max(0, TRIAL_DURATION_MS - elapsed);
  }, [trialState]);

  const { mutate: saveInstrument } = useMutation({
    mutationFn: async (state: InstrumentState) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selectedInstrument'] });
    },
  });

  const state = useMemo(() => instrumentQuery.data ?? { 
    selectedId: DEFAULT_INSTRUMENT_ID, 
    wellnessOverride: false,
    selectedEffectId: null,
    selectedAIToneId: null,
  }, [instrumentQuery.data]);

  const currentInstrumentId = wellnessMode && !state.wellnessOverride 
    ? (isPremium ? WELLNESS_INSTRUMENT_ID : DEFAULT_INSTRUMENT_ID)
    : state.selectedId;

  const currentInstrument = getInstrumentById(currentInstrumentId);

  const currentEffect = useMemo((): EffectPreset | null => {
    const settings = effectSettings[currentInstrumentId];
    if (settings?.effectId) {
      return getEffectPresetById(currentInstrumentId, settings.effectId) ?? null;
    }
    const defaultEffect = currentInstrument.effectPresets.find(e => !e.isPremium);
    return defaultEffect ?? null;
  }, [currentInstrumentId, effectSettings, currentInstrument]);

  const currentAITone = useMemo((): AITonePreset | null => {
    const settings = effectSettings[currentInstrumentId];
    if (settings?.aiToneId) {
      return getAITonePresetById(currentInstrumentId, settings.aiToneId) ?? null;
    }
    return null;
  }, [currentInstrumentId, effectSettings]);

  const selectInstrument = useCallback((instrumentId: string) => {
    const hasAllInstruments = hasEntitlement(ENTITLEMENTS.ALL_INSTRUMENTS) || isPremiumTrialActive;
    const isLocked = isInstrumentLocked(instrumentId, hasAllInstruments);
    const hasActiveTrial = isTrialActive(instrumentId);
    
    if (isLocked && !hasActiveTrial) {
      console.log(`[Instrument] ${instrumentId} is locked - showing upgrade`);
      setPendingInstrumentId(instrumentId);
      setShowUpgradeModal(true);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return false;
    }

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }

    saveInstrument({ 
      selectedId: instrumentId, 
      wellnessOverride: state.wellnessOverride,
      selectedEffectId: state.selectedEffectId,
      selectedAIToneId: state.selectedAIToneId,
    });
    
    console.log(`[Instrument] Selected: ${instrumentId}${hasActiveTrial ? ' (trial)' : isPremiumTrialActive ? ' (premium trial)' : ''}`);
    return true;
  }, [isPremiumTrialActive, hasEntitlement, state, saveInstrument, isTrialActive]);

  const selectEffect = useCallback((effectId: string) => {
    const effect = getEffectPresetById(currentInstrumentId, effectId);
    if (!effect) {
      console.log('[Instrument] Effect not found:', effectId);
      return false;
    }

    if (effect.isPremium && !isPremium && !isPremiumTrialActive) {
      console.log('[Instrument] Effect is premium:', effectId);
      setShowUpgradeModal(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return false;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newSettings: EffectSettings = {
      ...effectSettings,
      [currentInstrumentId]: {
        ...effectSettings[currentInstrumentId],
        effectId,
        aiToneId: effectSettings[currentInstrumentId]?.aiToneId ?? null,
        customizations: effectSettings[currentInstrumentId]?.customizations ?? {},
      },
    };
    saveEffects(newSettings);
    console.log(`[Instrument] Effect selected: ${effectId}`);
    return true;
  }, [currentInstrumentId, effectSettings, isPremium, isPremiumTrialActive, saveEffects]);

  const selectAITone = useCallback((toneId: string) => {
    const tone = getAITonePresetById(currentInstrumentId, toneId);
    if (!tone) {
      console.log('[Instrument] AI Tone not found:', toneId);
      return false;
    }

    if (tone.isPremium && !isPremium && !isPremiumTrialActive) {
      console.log('[Instrument] AI Tone is premium:', toneId);
      setShowUpgradeModal(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      return false;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newSettings: EffectSettings = {
      ...effectSettings,
      [currentInstrumentId]: {
        ...effectSettings[currentInstrumentId],
        effectId: tone.baseEffects,
        aiToneId: toneId,
        customizations: effectSettings[currentInstrumentId]?.customizations ?? {},
      },
    };
    saveEffects(newSettings);
    console.log(`[Instrument] AI Tone selected: ${toneId}`);
    return true;
  }, [currentInstrumentId, effectSettings, isPremium, isPremiumTrialActive, saveEffects]);

  const updateEffectCustomization = useCallback((customizations: Partial<EffectSettings[string]['customizations']>) => {
    const current = effectSettings[currentInstrumentId] ?? {
      effectId: currentInstrument.effectPresets[0]?.id ?? '',
      aiToneId: null,
      customizations: {},
    };

    const newSettings: EffectSettings = {
      ...effectSettings,
      [currentInstrumentId]: {
        ...current,
        customizations: {
          ...current.customizations,
          ...customizations,
        },
      },
    };
    saveEffects(newSettings);
    console.log('[Instrument] Customization updated');
  }, [currentInstrumentId, effectSettings, currentInstrument, saveEffects]);

  const createUserPreset = useCallback((name: string): UserPreset | null => {
    if (!isPremium && !isPremiumTrialActive) {
      setShowUpgradeModal(true);
      return null;
    }

    const current = effectSettings[currentInstrumentId];
    if (!current) {
      Alert.alert('No Settings', 'Configure an effect first to save as preset.');
      return null;
    }

    const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newPreset: UserPreset = {
      id: `preset_${Date.now()}`,
      name,
      instrumentId: currentInstrumentId,
      baseEffectId: current.effectId,
      customizations: current.customizations,
      createdAt: new Date().toISOString(),
      isShared: false,
      shareCode,
      likes: 0,
    };

    savePresets([...userPresets, newPreset]);
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    console.log('[Instrument] Preset created:', name);
    return newPreset;
  }, [isPremium, isPremiumTrialActive, currentInstrumentId, effectSettings, userPresets, savePresets]);

  const applyUserPreset = useCallback((presetId: string) => {
    const preset = userPresets.find(p => p.id === presetId);
    if (!preset) {
      console.log('[Instrument] Preset not found:', presetId);
      return false;
    }

    if (preset.instrumentId !== currentInstrumentId) {
      selectInstrument(preset.instrumentId);
    }

    const newSettings: EffectSettings = {
      ...effectSettings,
      [preset.instrumentId]: {
        effectId: preset.baseEffectId,
        aiToneId: null,
        customizations: preset.customizations,
      },
    };
    saveEffects(newSettings);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    console.log('[Instrument] Preset applied:', preset.name);
    return true;
  }, [userPresets, currentInstrumentId, effectSettings, selectInstrument, saveEffects]);

  const deleteUserPreset = useCallback((presetId: string) => {
    const newPresets = userPresets.filter(p => p.id !== presetId);
    savePresets(newPresets);
    console.log('[Instrument] Preset deleted:', presetId);
  }, [userPresets, savePresets]);

  const shareUserPreset = useCallback((presetId: string) => {
    const preset = userPresets.find(p => p.id === presetId);
    if (!preset) return null;

    const updatedPresets = userPresets.map(p => 
      p.id === presetId ? { ...p, isShared: true } : p
    );
    savePresets(updatedPresets);
    
    console.log('[Instrument] Preset shared:', preset.shareCode);
    return preset.shareCode;
  }, [userPresets, savePresets]);

  const preCacheInstrumentSounds = useCallback(async (instrumentId: string) => {
    const instrument = getInstrumentById(instrumentId);
    const primaryBank = instrument.soundBanks.find(b => !b.isPremium) ?? instrument.soundBanks[0];
    
    if (!primaryBank) return;

    console.log(`[Instrument] Pre-caching sounds for ${instrumentId}...`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newStatus: SoundCacheStatus = {
      ...cacheStatus,
      [instrumentId]: {
        cached: true,
        cachedAt: new Date().toISOString(),
        soundBankId: primaryBank.id,
      },
    };
    saveCacheStatus(newStatus);
    console.log(`[Instrument] Cached ${instrumentId} sounds`);
  }, [cacheStatus, saveCacheStatus]);

  const isInstrumentCached = useCallback((instrumentId: string): boolean => {
    return cacheStatus[instrumentId]?.cached ?? false;
  }, [cacheStatus]);

  const getAIRecommendation = useCallback(() => {
    const userHistory = {
      genres: ['rock', 'pop'],
      accuracy: 78,
      preferredInstruments: [currentInstrumentId],
    };
    
    const recommendation = getInstrumentAIRecommendation(userHistory, currentInstrumentId);
    if (recommendation) {
      setCurrentAIRecommendation(recommendation);
      setShowAIRecommendation(true);
    }
    return recommendation;
  }, [currentInstrumentId]);

  const dismissAIRecommendation = useCallback(() => {
    setShowAIRecommendation(false);
    setCurrentAIRecommendation(null);
  }, []);

  const applyAIRecommendation = useCallback(() => {
    if (!currentAIRecommendation) return false;
    
    const success = selectInstrument(currentAIRecommendation.instrumentId);
    if (success) {
      selectEffect(currentAIRecommendation.effectId);
      dismissAIRecommendation();
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    return success;
  }, [currentAIRecommendation, selectInstrument, selectEffect, dismissAIRecommendation]);

  const toggleWellnessOverride = useCallback(() => {
    const newOverride = !state.wellnessOverride;
    saveInstrument({ 
      ...state,
      wellnessOverride: newOverride,
    });
  }, [state, saveInstrument]);

  const setWellnessModeActive = useCallback((active: boolean) => {
    setWellnessMode(active);
    console.log(`[Instrument] Wellness mode: ${active ? 'enabled' : 'disabled'}`);
  }, []);

  const getAvailableInstruments = useCallback((): (Instrument & { locked: boolean; hasActiveTrial: boolean; hasPremiumTrial: boolean; isCached: boolean })[] => {
    const hasAllInstruments = hasEntitlement(ENTITLEMENTS.ALL_INSTRUMENTS) || isPremiumTrialActive;
    return INSTRUMENTS.map(instrument => ({
      ...instrument,
      locked: isInstrumentLocked(instrument.id, hasAllInstruments) && !isTrialActive(instrument.id),
      hasActiveTrial: isTrialActive(instrument.id),
      hasPremiumTrial: isPremiumTrialActive && instrument.isPremium,
      isCached: isInstrumentCached(instrument.id),
    }));
  }, [isPremiumTrialActive, hasEntitlement, isTrialActive, isInstrumentCached]);

  const getAvailableEffects = useCallback((): (EffectPreset & { locked: boolean })[] => {
    return currentInstrument.effectPresets.map(effect => ({
      ...effect,
      locked: effect.isPremium && !isPremium && !isPremiumTrialActive,
    }));
  }, [currentInstrument, isPremium, isPremiumTrialActive]);

  const getAvailableAITones = useCallback((): (AITonePreset & { locked: boolean })[] => {
    return currentInstrument.aiTonePresets.map(tone => ({
      ...tone,
      locked: tone.isPremium && !isPremium && !isPremiumTrialActive,
    }));
  }, [currentInstrument, isPremium, isPremiumTrialActive]);

  const startTrial = useCallback((instrumentId: string) => {
    const instrument = getInstrumentById(instrumentId);
    if (!instrument.isPremium) {
      console.log('[Instrument] Cannot trial free instrument');
      return false;
    }
    
    if (trialState.startedAt) {
      console.log('[Instrument] Trial already used');
      Alert.alert(
        'Trial Already Used',
        'You have already used your free trial. Upgrade to Premium to unlock all instruments!',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    const newTrial: TrialState = {
      isActive: true,
      startedAt: new Date().toISOString(),
      instrumentId,
    };
    
    saveTrial(newTrial);
    
    saveInstrument({ 
      ...state,
      selectedId: instrumentId,
    });
    
    preCacheInstrumentSounds(instrumentId);
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    console.log(`[Instrument] Trial started for ${instrumentId}`);
    Alert.alert(
      '🎉 Trial Started!',
      `You now have 7 days to try ${instrument.name} with all effects. Enjoy!`,
      [{ text: 'Let\'s Go!' }]
    );
    
    return true;
  }, [trialState, saveTrial, saveInstrument, state, preCacheInstrumentSounds]);

  const dismissUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setPendingInstrumentId(null);
  }, []);

  const hasUsedTrial = useMemo(() => {
    return trialState.startedAt !== null;
  }, [trialState]);

  const getInstrumentBundles = useCallback((): InstrumentBundle[] => {
    return INSTRUMENT_BUNDLES;
  }, []);

  const getFeaturedBundle = useCallback((): InstrumentBundle | undefined => {
    return INSTRUMENT_BUNDLES.find(b => b.featured);
  }, []);

  useEffect(() => {
    const hasAllInstruments = hasEntitlement(ENTITLEMENTS.ALL_INSTRUMENTS) || isPremiumTrialActive;
    if (isInstrumentLocked(state.selectedId, hasAllInstruments) && !isTrialActive(state.selectedId)) {
      saveInstrument({ 
        ...state,
        selectedId: DEFAULT_INSTRUMENT_ID,
      });
    }
  }, [isPremium, isPremiumTrialActive, hasEntitlement, state, saveInstrument, isTrialActive]);

  useEffect(() => {
    preCacheInstrumentSounds(currentInstrumentId);
  }, [currentInstrumentId, preCacheInstrumentSounds]);

  return {
    currentInstrument,
    currentEffect,
    currentAITone,
    selectedInstrumentId: state.selectedId,
    wellnessMode,
    wellnessOverride: state.wellnessOverride,
    isLoading: instrumentQuery.isLoading,
    instruments: getAvailableInstruments(),
    allInstruments: INSTRUMENTS,
    premiumInstruments: PREMIUM_INSTRUMENTS,
    availableEffects: getAvailableEffects(),
    availableAITones: getAvailableAITones(),
    userPresets,
    previewPlaying,
    setPreviewPlaying,
    selectInstrument,
    selectEffect,
    selectAITone,
    updateEffectCustomization,
    createUserPreset,
    applyUserPreset,
    deleteUserPreset,
    shareUserPreset,
    toggleWellnessOverride,
    setWellnessModeActive,
    isPremium,
    showUpgradeModal,
    pendingInstrumentId,
    dismissUpgradeModal,
    startTrial,
    hasUsedTrial,
    trialTimeRemaining,
    isTrialActive,
    isDemoMode,
    isPremiumTrialActive,
    premiumTrialDaysRemaining: trialDaysRemaining,
    showEffectsPanel,
    setShowEffectsPanel,
    preCacheInstrumentSounds,
    isInstrumentCached,
    getAIRecommendation,
    showAIRecommendation,
    currentAIRecommendation,
    dismissAIRecommendation,
    applyAIRecommendation,
    getInstrumentBundles,
    getFeaturedBundle,
    effectSettings,
  };
});
