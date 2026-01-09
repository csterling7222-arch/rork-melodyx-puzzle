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
} from '@/constants/instruments';
import { usePurchases } from './PurchasesContext';

const STORAGE_KEY = 'melodyx_selected_instrument';
const TRIAL_STORAGE_KEY = 'melodyx_instrument_trial';
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface InstrumentState {
  selectedId: string;
  wellnessOverride: boolean;
}

interface TrialState {
  isActive: boolean;
  startedAt: string | null;
  instrumentId: string | null;
}

export const [InstrumentProvider, useInstrument] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { isPremium, isDemoMode } = usePurchases();
  const [wellnessMode, setWellnessMode] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingInstrumentId, setPendingInstrumentId] = useState<string | null>(null);

  const instrumentQuery = useQuery({
    queryKey: ['selectedInstrument'],
    queryFn: async (): Promise<InstrumentState> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (isInstrumentLocked(parsed.selectedId, isPremium) && !isTrialActive(parsed.selectedId)) {
            return { selectedId: DEFAULT_INSTRUMENT_ID, wellnessOverride: false };
          }
          return parsed;
        }
      } catch (error) {
        console.log('Error loading instrument state:', error);
      }
      return { selectedId: DEFAULT_INSTRUMENT_ID, wellnessOverride: false };
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
        console.log('Error loading trial state:', error);
      }
      return { isActive: false, startedAt: null, instrumentId: null };
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

  const trialState = useMemo(() => 
    trialQuery.data ?? { isActive: false, startedAt: null, instrumentId: null }
  , [trialQuery.data]);

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
    wellnessOverride: false 
  }, [instrumentQuery.data]);

  const currentInstrumentId = wellnessMode && !state.wellnessOverride 
    ? (isPremium ? WELLNESS_INSTRUMENT_ID : DEFAULT_INSTRUMENT_ID)
    : state.selectedId;

  const currentInstrument = getInstrumentById(currentInstrumentId);

  const selectInstrument = useCallback((instrumentId: string) => {
    const isLocked = isInstrumentLocked(instrumentId, isPremium);
    const hasActiveTrial = isTrialActive(instrumentId);
    
    if (isLocked && !hasActiveTrial) {
      console.log(`Instrument ${instrumentId} is locked - showing upgrade options`);
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
      wellnessOverride: state.wellnessOverride 
    });
    console.log(`Selected instrument: ${instrumentId}${hasActiveTrial ? ' (trial)' : ''}`);
    return true;
  }, [isPremium, state.wellnessOverride, saveInstrument, isTrialActive]);

  const toggleWellnessOverride = useCallback(() => {
    const newOverride = !state.wellnessOverride;
    saveInstrument({ 
      selectedId: state.selectedId, 
      wellnessOverride: newOverride 
    });
  }, [state, saveInstrument]);

  const setWellnessModeActive = useCallback((active: boolean) => {
    setWellnessMode(active);
    console.log(`Wellness mode: ${active ? 'enabled' : 'disabled'}`);
  }, []);

  const getAvailableInstruments = useCallback((): (Instrument & { locked: boolean; hasActiveTrial: boolean })[] => {
    return INSTRUMENTS.map(instrument => ({
      ...instrument,
      locked: isInstrumentLocked(instrument.id, isPremium) && !isTrialActive(instrument.id),
      hasActiveTrial: isTrialActive(instrument.id),
    }));
  }, [isPremium, isTrialActive]);

  const startTrial = useCallback((instrumentId: string) => {
    const instrument = getInstrumentById(instrumentId);
    if (!instrument.isPremium) {
      console.log('Cannot start trial for free instrument');
      return false;
    }
    
    if (trialState.startedAt) {
      console.log('Trial already used');
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
      selectedId: instrumentId, 
      wellnessOverride: state.wellnessOverride 
    });
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    console.log(`[Instrument] Trial started for ${instrumentId}`);
    Alert.alert(
      '🎉 Trial Started!',
      `You now have 7 days to try ${instrument.name}. Enjoy!`,
      [{ text: 'Let\'s Go!' }]
    );
    
    return true;
  }, [trialState, saveTrial, saveInstrument, state.wellnessOverride]);

  const dismissUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setPendingInstrumentId(null);
  }, []);

  const hasUsedTrial = useMemo(() => {
    return trialState.startedAt !== null;
  }, [trialState]);

  useEffect(() => {
    if (isInstrumentLocked(state.selectedId, isPremium) && !isTrialActive(state.selectedId)) {
      saveInstrument({ 
        selectedId: DEFAULT_INSTRUMENT_ID, 
        wellnessOverride: state.wellnessOverride 
      });
    }
  }, [isPremium, state.selectedId, state.wellnessOverride, saveInstrument, isTrialActive]);

  return {
    currentInstrument,
    selectedInstrumentId: state.selectedId,
    wellnessMode,
    wellnessOverride: state.wellnessOverride,
    isLoading: instrumentQuery.isLoading,
    instruments: getAvailableInstruments(),
    allInstruments: INSTRUMENTS,
    premiumInstruments: PREMIUM_INSTRUMENTS,
    previewPlaying,
    setPreviewPlaying,
    selectInstrument,
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
  };
});
