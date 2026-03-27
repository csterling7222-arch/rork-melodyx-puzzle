import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { 
  ECO_POINTS_PER_WIN, 
  ECO_POINTS_PER_PERFECT, 
  ECO_POINTS_PER_TON,
  ECO_PROJECTS,
  ECO_MELODIES,
  getRandomEcoMelody,
  type EcoProject,
} from '@/constants/sustainability';
import { Melody } from '@/utils/melodies';

interface EcoOffset {
  id: string;
  projectId: string;
  tons: number;
  pointsSpent: number;
  date: string;
}

interface EcoState {
  ecoPoints: number;
  totalOffsetTons: number;
  ecoModeEnabled: boolean;
  offsets: EcoOffset[];
  currentEcoMelody: Melody | null;
  solvedEcoMelodies: string[];
}

const STORAGE_KEY = 'melodyx_eco_state';

const DEFAULT_ECO_STATE: EcoState = {
  ecoPoints: 0,
  totalOffsetTons: 0,
  ecoModeEnabled: false,
  offsets: [],
  currentEcoMelody: null,
  solvedEcoMelodies: [],
};

export const [EcoProvider, useEco] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [showOffsetModal, setShowOffsetModal] = useState(false);
  const pendingSaveRef = useRef<EcoState | null>(null);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (pendingSaveRef.current) {
          console.log('[Eco] App going to background, force saving eco state...');
          try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pendingSaveRef.current));
            console.log('[Eco] Force saved eco state on background');
          } catch (error) {
            console.error('[Eco] Error force saving on background:', error);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const ecoQuery = useQuery({
    queryKey: ['ecoState'],
    queryFn: async (): Promise<EcoState> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.log('Error loading eco state:', error);
      }
      return DEFAULT_ECO_STATE;
    },
  });

  const { mutate: saveEcoState } = useMutation({
    mutationFn: async (state: EcoState) => {
      pendingSaveRef.current = state;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('[Eco] Saved eco state - Points:', state.ecoPoints, 'Offset tons:', state.totalOffsetTons);
      pendingSaveRef.current = null;
      return state;
    },
    onSuccess: (savedState) => {
      queryClient.setQueryData(['ecoState'], savedState);
    },
  });

  const ecoState = ecoQuery.data ?? DEFAULT_ECO_STATE;

  const toggleEcoMode = useCallback(() => {
    const newMelody = !ecoState.ecoModeEnabled 
      ? getRandomEcoMelody(ecoState.solvedEcoMelodies)
      : null;
    
    const newState: EcoState = {
      ...ecoState,
      ecoModeEnabled: !ecoState.ecoModeEnabled,
      currentEcoMelody: newMelody,
    };
    saveEcoState(newState);
  }, [ecoState, saveEcoState]);

  const addEcoPoints = useCallback((points: number) => {
    const newState: EcoState = {
      ...ecoState,
      ecoPoints: ecoState.ecoPoints + points,
    };
    saveEcoState(newState);
  }, [ecoState, saveEcoState]);

  const recordEcoWin = useCallback((isPerfect: boolean = false) => {
    const points = isPerfect ? ECO_POINTS_PER_PERFECT : ECO_POINTS_PER_WIN;
    const melodyName = ecoState.currentEcoMelody?.name;
    
    const newState: EcoState = {
      ...ecoState,
      ecoPoints: ecoState.ecoPoints + points,
      solvedEcoMelodies: melodyName && !ecoState.solvedEcoMelodies.includes(melodyName)
        ? [...ecoState.solvedEcoMelodies, melodyName]
        : ecoState.solvedEcoMelodies,
      currentEcoMelody: getRandomEcoMelody(
        melodyName 
          ? [...ecoState.solvedEcoMelodies, melodyName]
          : ecoState.solvedEcoMelodies
      ),
    };
    saveEcoState(newState);
    return points;
  }, [ecoState, saveEcoState]);

  const purchaseOffset = useCallback((projectId: string, tons: number): boolean => {
    const pointsCost = tons * ECO_POINTS_PER_TON;
    if (ecoState.ecoPoints < pointsCost) return false;

    const offset: EcoOffset = {
      id: `offset_${Date.now()}`,
      projectId,
      tons,
      pointsSpent: pointsCost,
      date: new Date().toISOString(),
    };

    const newState: EcoState = {
      ...ecoState,
      ecoPoints: ecoState.ecoPoints - pointsCost,
      totalOffsetTons: ecoState.totalOffsetTons + tons,
      offsets: [...ecoState.offsets, offset],
    };
    saveEcoState(newState);
    return true;
  }, [ecoState, saveEcoState]);

  const getNextEcoMelody = useCallback(() => {
    const newMelody = getRandomEcoMelody(ecoState.solvedEcoMelodies);
    const newState: EcoState = {
      ...ecoState,
      currentEcoMelody: newMelody,
    };
    saveEcoState(newState);
    return newMelody;
  }, [ecoState, saveEcoState]);

  const getProjectById = useCallback((projectId: string): EcoProject | undefined => {
    return ECO_PROJECTS.find(p => p.id === projectId);
  }, []);

  const canAffordOffset = useCallback((tons: number): boolean => {
    return ecoState.ecoPoints >= tons * ECO_POINTS_PER_TON;
  }, [ecoState.ecoPoints]);

  return {
    ecoPoints: ecoState.ecoPoints,
    totalOffsetTons: ecoState.totalOffsetTons,
    ecoModeEnabled: ecoState.ecoModeEnabled,
    offsets: ecoState.offsets,
    currentEcoMelody: ecoState.currentEcoMelody,
    solvedEcoMelodies: ecoState.solvedEcoMelodies,
    isLoading: ecoQuery.isLoading,
    showOffsetModal,
    setShowOffsetModal,
    toggleEcoMode,
    addEcoPoints,
    recordEcoWin,
    purchaseOffset,
    getNextEcoMelody,
    getProjectById,
    canAffordOffset,
    ecoMelodies: ECO_MELODIES,
    ecoProjects: ECO_PROJECTS,
  };
});
