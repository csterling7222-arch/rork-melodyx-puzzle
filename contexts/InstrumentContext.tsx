import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { 
  INSTRUMENTS, 
  Instrument, 
  DEFAULT_INSTRUMENT_ID, 
  WELLNESS_INSTRUMENT_ID,
  getInstrumentById,
  isInstrumentLocked,
} from '@/constants/instruments';
import { usePurchases } from './PurchasesContext';

const STORAGE_KEY = 'melodyx_selected_instrument';

interface InstrumentState {
  selectedId: string;
  wellnessOverride: boolean;
}

export const [InstrumentProvider, useInstrument] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { isPremium } = usePurchases();
  const [wellnessMode, setWellnessMode] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const instrumentQuery = useQuery({
    queryKey: ['selectedInstrument'],
    queryFn: async (): Promise<InstrumentState> => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (isInstrumentLocked(parsed.selectedId, isPremium)) {
          return { selectedId: DEFAULT_INSTRUMENT_ID, wellnessOverride: false };
        }
        return parsed;
      }
      return { selectedId: DEFAULT_INSTRUMENT_ID, wellnessOverride: false };
    },
  });

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
    if (isInstrumentLocked(instrumentId, isPremium)) {
      console.log(`Instrument ${instrumentId} is locked - premium required`);
      return false;
    }

    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }

    saveInstrument({ 
      selectedId: instrumentId, 
      wellnessOverride: state.wellnessOverride 
    });
    console.log(`Selected instrument: ${instrumentId}`);
    return true;
  }, [isPremium, state.wellnessOverride, saveInstrument]);

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

  const getAvailableInstruments = useCallback((): (Instrument & { locked: boolean })[] => {
    return INSTRUMENTS.map(instrument => ({
      ...instrument,
      locked: isInstrumentLocked(instrument.id, isPremium),
    }));
  }, [isPremium]);

  useEffect(() => {
    if (isInstrumentLocked(state.selectedId, isPremium)) {
      saveInstrument({ 
        selectedId: DEFAULT_INSTRUMENT_ID, 
        wellnessOverride: state.wellnessOverride 
      });
    }
  }, [isPremium, state.selectedId, state.wellnessOverride, saveInstrument]);

  return {
    currentInstrument,
    selectedInstrumentId: state.selectedId,
    wellnessMode,
    wellnessOverride: state.wellnessOverride,
    isLoading: instrumentQuery.isLoading,
    instruments: getAvailableInstruments(),
    allInstruments: INSTRUMENTS,
    previewPlaying,
    setPreviewPlaying,
    selectInstrument,
    toggleWellnessOverride,
    setWellnessModeActive,
    isPremium,
  };
});
