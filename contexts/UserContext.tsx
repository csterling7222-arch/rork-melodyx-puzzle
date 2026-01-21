import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ACHIEVEMENTS, Achievement } from '@/constants/achievements';
import { getDailyReward, getStreakMilestone } from '@/constants/shop';
import { usePurchases } from './PurchasesContext';
import { useAuth } from './AuthContext';
import { 
  initSyncManager, 
  cleanupSyncManager, 
  queueChange, 
  saveLocalData, 
  getSyncStatus, 
  syncNow,
  SyncStatus,
} from '@/utils/syncManager';

export interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  createdAt: string;
  isPremium: boolean;
  premiumExpiresAt: string | null;
}

export interface UserInventory {
  coins: number;
  hints: number;
  ownedSkins: string[];
  equippedSkin: string;
  ownedBadges: string[];
  ownedThemes: string[];
  equippedTheme: string;
  ownedCosmetics: string[];
  equippedCosmetics: {
    badge: string | null;
    frame: string | null;
    title: string | null;
    watermark: string | null;
    avatarEffect: string | null;
  };
  ownedPowerUps: Record<string, number>;
  ownedLearningPacks: string[];
  ownedInstrumentAddons: string[];
  ownedBundles: string[];
}

export interface UserProgress {
  totalWins: number;
  perfectSolves: number;
  feverSolves: number;
  feverHighScore: number;
  totalFeverPoints: number;
  countriesPlayed: string[];
  sharesCount: number;
  duelsPlayed: number;
  duelsWon: number;
  eventsCompleted: number;
  createdMelodies: number;
  featuredMelodies: number;
}

export interface DailyRewardState {
  lastClaimDate: string | null;
  consecutiveDays: number;
  claimedToday: boolean;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

interface UserState {
  profile: UserProfile;
  inventory: UserInventory;
  progress: UserProgress;
  achievements: UnlockedAchievement[];
  dailyReward: DailyRewardState;
}

const STORAGE_KEY_PREFIX = 'melodyx_user_state';
const LEGACY_STORAGE_KEY = 'melodyx_user_state';
const GUEST_STORAGE_KEY = 'melodyx_user_state_guest';
const GUEST_ID_KEY = 'melodyx_guest_id';
const DATA_VERSION_KEY = 'melodyx_data_version';
const CURRENT_DATA_VERSION = 2;
const DEVICE_ID_KEY = 'melodyx_device_id';
const LAST_STORAGE_KEY_KEY = 'melodyx_last_storage_key';
const KNOWN_USER_KEYS_KEY = 'melodyx_known_user_keys';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

function getStorageKey(userId: string | null): string {
  if (!userId) return GUEST_STORAGE_KEY;
  return `${STORAGE_KEY_PREFIX}_${userId}`;
}

async function getDataVersion(): Promise<number> {
  try {
    const version = await AsyncStorage.getItem(DATA_VERSION_KEY);
    return version ? parseInt(version, 10) : 1;
  } catch {
    return 1;
  }
}

async function setDataVersion(version: number): Promise<void> {
  await AsyncStorage.setItem(DATA_VERSION_KEY, String(version));
}

function migrateStateToVersion2(state: UserState): UserState {
  return {
    ...state,
    inventory: {
      ...state.inventory,
      ownedThemes: state.inventory.ownedThemes || ['default'],
      equippedTheme: state.inventory.equippedTheme || 'default',
      ownedCosmetics: state.inventory.ownedCosmetics || [],
      equippedCosmetics: state.inventory.equippedCosmetics || {
        badge: null,
        frame: null,
        title: null,
        watermark: null,
        avatarEffect: null,
      },
      ownedPowerUps: state.inventory.ownedPowerUps || {},
      ownedLearningPacks: state.inventory.ownedLearningPacks || [],
      ownedInstrumentAddons: state.inventory.ownedInstrumentAddons || [],
      ownedBundles: state.inventory.ownedBundles || [],
    },
    progress: {
      ...state.progress,
      createdMelodies: state.progress.createdMelodies || 0,
      featuredMelodies: state.progress.featuredMelodies || 0,
    },
  };
}

async function runMigrations(state: UserState, storageKey: string): Promise<UserState> {
  const currentVersion = await getDataVersion();
  let migratedState = state;
  
  console.log('[User] Current data version:', currentVersion, 'Target:', CURRENT_DATA_VERSION);
  
  if (currentVersion < 2) {
    console.log('[User] Running migration to version 2...');
    migratedState = migrateStateToVersion2(migratedState);
  }
  
  if (currentVersion < CURRENT_DATA_VERSION) {
    await AsyncStorage.setItem(storageKey, JSON.stringify(migratedState));
    await setDataVersion(CURRENT_DATA_VERSION);
    console.log('[User] Migration complete, data version:', CURRENT_DATA_VERSION);
  }
  
  return migratedState;
}

async function getKnownUserKeys(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(KNOWN_USER_KEYS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function addKnownUserKey(key: string): Promise<void> {
  try {
    const keys = await getKnownUserKeys();
    if (!keys.includes(key)) {
      keys.push(key);
      await AsyncStorage.setItem(KNOWN_USER_KEYS_KEY, JSON.stringify(keys));
      console.log('[User] Added known user key:', key);
    }
  } catch (error) {
    console.log('[User] Error adding known user key:', error);
  }
}

async function getLastStorageKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_STORAGE_KEY_KEY);
  } catch {
    return null;
  }
}

async function setLastStorageKey(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_STORAGE_KEY_KEY, key);
    console.log('[User] Saved last storage key:', key);
  } catch (error) {
    console.log('[User] Error saving last storage key:', error);
  }
}

async function findBestExistingData(): Promise<{ key: string; data: UserState } | null> {
  console.log('[User] Searching for existing user data...');
  
  const lastKey = await getLastStorageKey();
  if (lastKey) {
    try {
      const data = await AsyncStorage.getItem(lastKey);
      if (data) {
        console.log('[User] Found data at last known key:', lastKey);
        return { key: lastKey, data: JSON.parse(data) };
      }
    } catch (error) {
      console.log('[User] Error reading last key:', error);
    }
  }
  
  const knownKeys = await getKnownUserKeys();
  for (const key of knownKeys) {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data) as UserState;
        if (parsed.progress && (parsed.progress.totalWins > 0 || parsed.inventory?.coins > 100)) {
          console.log('[User] Found data with progress at known key:', key);
          return { key, data: parsed };
        }
      }
    } catch (error) {
      console.log('[User] Error reading known key:', key, error);
    }
  }
  
  const keysToCheck = [GUEST_STORAGE_KEY, LEGACY_STORAGE_KEY];
  for (const key of keysToCheck) {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        console.log('[User] Found data at fallback key:', key);
        return { key, data: JSON.parse(data) };
      }
    } catch (error) {
      console.log('[User] Error reading fallback key:', key, error);
    }
  }
  
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const userStateKeys = allKeys.filter(k => k.startsWith(STORAGE_KEY_PREFIX));
    console.log('[User] Found user state keys:', userStateKeys);
    
    let bestData: { key: string; data: UserState } | null = null;
    let bestProgress = 0;
    
    for (const key of userStateKeys) {
      try {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data) as UserState;
          const progress = (parsed.progress?.totalWins || 0) + (parsed.inventory?.coins || 0);
          if (progress > bestProgress) {
            bestProgress = progress;
            bestData = { key, data: parsed };
          }
        }
      } catch (error) {
        console.log('[User] Error reading key:', key, error);
      }
    }
    
    if (bestData) {
      console.log('[User] Found best data at:', bestData.key, 'with progress score:', bestProgress);
      return bestData;
    }
  } catch (error) {
    console.log('[User] Error scanning all keys:', error);
  }
  
  console.log('[User] No existing user data found');
  return null;
}

async function migrateOldData(newKey: string): Promise<UserState | null> {
  try {
    const existingData = await findBestExistingData();
    if (existingData && existingData.key !== newKey) {
      console.log('[User] Migrating data from', existingData.key, 'to', newKey);
      const migrated = await runMigrations(existingData.data, newKey);
      await AsyncStorage.setItem(newKey, JSON.stringify(migrated));
      await addKnownUserKey(newKey);
      await setLastStorageKey(newKey);
      console.log('[User] Migration complete to:', newKey);
      return migrated;
    }
    
    const legacyData = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyData && newKey !== LEGACY_STORAGE_KEY) {
      const parsed = JSON.parse(legacyData) as UserState;
      const migrated = await runMigrations(parsed, newKey);
      await AsyncStorage.setItem(newKey, JSON.stringify(migrated));
      await addKnownUserKey(newKey);
      await setLastStorageKey(newKey);
      console.log('[User] Migrated legacy data to new key:', newKey);
      return migrated;
    }
    
    const guestData = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    if (guestData && newKey !== GUEST_STORAGE_KEY) {
      const parsed = JSON.parse(guestData) as UserState;
      const migrated = await runMigrations(parsed, newKey);
      await AsyncStorage.setItem(newKey, JSON.stringify(migrated));
      await addKnownUserKey(newKey);
      await setLastStorageKey(newKey);
      console.log('[User] Migrated guest data to user key:', newKey);
      return migrated;
    }
  } catch (error) {
    console.log('[User] Migration error:', error);
  }
  return null;
}

function createDefaultUserState(userId: string, username: string, email: string | null): UserState {
  return {
    profile: {
      id: userId,
      username,
      email,
      createdAt: new Date().toISOString(),
      isPremium: false,
      premiumExpiresAt: null,
    },
    inventory: {
      coins: 100,
      hints: 3,
      ownedSkins: ['default'],
      equippedSkin: 'default',
      ownedBadges: [],
      ownedThemes: ['default'],
      equippedTheme: 'default',
      ownedCosmetics: [],
      equippedCosmetics: {
        badge: null,
        frame: null,
        title: null,
        watermark: null,
        avatarEffect: null,
      },
      ownedPowerUps: {},
      ownedLearningPacks: [],
      ownedInstrumentAddons: [],
      ownedBundles: [],
    },
    progress: {
      totalWins: 0,
      perfectSolves: 0,
      feverSolves: 0,
      feverHighScore: 0,
      totalFeverPoints: 0,
      countriesPlayed: [],
      sharesCount: 0,
      duelsPlayed: 0,
      duelsWon: 0,
      eventsCompleted: 0,
      createdMelodies: 0,
      featuredMelodies: 0,
    },
    achievements: [],
    dailyReward: {
      lastClaimDate: null,
      consecutiveDays: 0,
      claimedToday: false,
    },
  };
}

let FALLBACK_USER_STATE: UserState | null = null;

function getFallbackUserState(): UserState {
  if (!FALLBACK_USER_STATE) {
    FALLBACK_USER_STATE = createDefaultUserState(
      `guest_fallback`,
      'MelodyPlayer',
      null
    );
  }
  return FALLBACK_USER_STATE;
}

function isFallbackState(state: UserState): boolean {
  return state.profile.id === 'guest_fallback';
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

async function asyncStorageRetry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRY_ATTEMPTS
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`[User] AsyncStorage operation failed (attempt ${attempt}/${retries}):`, error);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }
  throw new Error('AsyncStorage operation failed after retries');
}

async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existingId = await asyncStorageRetry(() => AsyncStorage.getItem(DEVICE_ID_KEY));
    if (existingId) {
      console.log('[User] Found existing device ID:', existingId);
      return existingId;
    }
    const newId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await asyncStorageRetry(() => AsyncStorage.setItem(DEVICE_ID_KEY, newId));
    console.log('[User] Created new device ID:', newId);
    return newId;
  } catch (error) {
    console.error('[User] Critical error with device ID:', error);
    throw error;
  }
}

async function getOrCreateGuestId(): Promise<string> {
  try {
    const existingId = await asyncStorageRetry(() => AsyncStorage.getItem(GUEST_ID_KEY));
    if (existingId) {
      console.log('[User] Found existing guest ID:', existingId);
      return existingId;
    }
    
    const deviceId = await getOrCreateDeviceId();
    const newId = `guest_${deviceId}`;
    await asyncStorageRetry(() => AsyncStorage.setItem(GUEST_ID_KEY, newId));
    console.log('[User] Created new guest ID:', newId);
    return newId;
  } catch (error) {
    console.error('[User] Error with guest ID, using device fallback:', error);
    try {
      const deviceId = await getOrCreateDeviceId();
      return `guest_${deviceId}`;
    } catch {
      console.error('[User] All ID generation failed, using emergency fallback');
      return `guest_emergency_${Date.now()}`;
    }
  }
}

export const [UserProvider, useUser] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const { isPremium: rcIsPremium } = usePurchases();
  const { user: authUser, isAuthenticated, isAnonymous } = useAuth();
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isGuestIdLoaded, setIsGuestIdLoaded] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncAt: null,
    pendingChanges: 0,
    isSyncing: false,
    syncError: null,
  });
  const guestIdLoadAttemptRef = useRef(0);
  const pendingSaveRef = useRef<UserState | null>(null);
  const syncInitializedRef = useRef(false);

  useEffect(() => {
    const loadGuestId = async () => {
      guestIdLoadAttemptRef.current++;
      const attempt = guestIdLoadAttemptRef.current;
      
      try {
        console.log('[User] Loading guest ID (attempt', attempt, ')...');
        const id = await getOrCreateGuestId();
        
        if (guestIdLoadAttemptRef.current !== attempt) {
          console.log('[User] Stale guest ID load, ignoring');
          return;
        }
        
        setGuestId(id);
        setInitError(null);
        console.log('[User] Guest ID loaded successfully:', id);
      } catch (error) {
        console.error('[User] Critical error loading guest ID:', error);
        setInitError(error instanceof Error ? error : new Error('Failed to load guest ID'));
      } finally {
        if (guestIdLoadAttemptRef.current === attempt) {
          setIsGuestIdLoaded(true);
        }
      }
    };
    loadGuestId();
  }, []);

  useEffect(() => {
    if (authUser?.uid && !isAnonymous && !syncInitializedRef.current) {
      syncInitializedRef.current = true;
      console.log('[User] Initializing sync manager for:', authUser.uid);
      initSyncManager(authUser.uid).then(() => {
        getSyncStatus(authUser.uid).then(status => {
          setSyncStatus(status);
          console.log('[User] Sync status loaded:', status.lastSyncAt);
        });
      });
    }
    
    return () => {
      if (syncInitializedRef.current) {
        cleanupSyncManager();
        syncInitializedRef.current = false;
      }
    };
  }, [authUser?.uid, isAnonymous]);

  const storageKey = useMemo(() => {
    if (authUser?.uid) {
      return getStorageKey(authUser.uid);
    }
    return GUEST_STORAGE_KEY;
  }, [authUser?.uid]);

  const authUid = authUser?.uid;
  const authEmail = authUser?.email;
  const authDisplayName = authUser?.displayName;

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (pendingSaveRef.current && !isFallbackState(pendingSaveRef.current)) {
          console.log('[User] App going to background, force saving user state...');
          try {
            await AsyncStorage.setItem(storageKey, JSON.stringify(pendingSaveRef.current));
            await addKnownUserKey(storageKey);
            await setLastStorageKey(storageKey);
            console.log('[User] Force saved user state on background');
          } catch (error) {
            console.error('[User] Error force saving on background:', error);
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [storageKey]);

  const userQuery = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: ['userState', storageKey, guestId],
    queryFn: async (): Promise<UserState> => {
      try {
        console.log('[User] Loading user state from:', storageKey);
        console.log('[User] Current guestId:', guestId, 'authUid:', authUid);
        
        let stored = await asyncStorageRetry(() => AsyncStorage.getItem(storageKey));
        
        if (!stored) {
          console.log('[User] No data at primary key, checking for migration...');
          const migratedData = await migrateOldData(storageKey);
          if (migratedData) {
            console.log('[User] Using migrated data');
            const today = getTodayString();
            if (migratedData.dailyReward.lastClaimDate !== today) {
              migratedData.dailyReward.claimedToday = false;
            }
            if (authUid) {
              migratedData.profile.id = authUid;
              migratedData.profile.email = authEmail ?? null;
              if (authDisplayName && migratedData.profile.username === 'MelodyPlayer') {
                migratedData.profile.username = authDisplayName;
              }
            }
            await asyncStorageRetry(() => AsyncStorage.setItem(storageKey, JSON.stringify(migratedData)));
            await addKnownUserKey(storageKey);
            await setLastStorageKey(storageKey);
            return migratedData;
          }
        }
        
        if (stored) {
          let parsed = JSON.parse(stored) as UserState;
          
          parsed = await runMigrations(parsed, storageKey);
          
          const today = getTodayString();
          if (parsed.dailyReward.lastClaimDate !== today) {
            parsed.dailyReward.claimedToday = false;
          }
          if (authUid) {
            parsed.profile.id = authUid;
            parsed.profile.email = authEmail ?? null;
            if (authDisplayName && parsed.profile.username === 'MelodyPlayer') {
              parsed.profile.username = authDisplayName;
            }
          }
          
          await asyncStorageRetry(() => AsyncStorage.setItem(storageKey, JSON.stringify(parsed)));
          await addKnownUserKey(storageKey);
          await setLastStorageKey(storageKey);
          
          console.log('[User] Successfully loaded user state for:', parsed.profile.id);
          console.log('[User] Progress:', JSON.stringify(parsed.progress));
          console.log('[User] Inventory coins:', parsed.inventory.coins, 'hints:', parsed.inventory.hints);
          return parsed;
        }
      } catch (error) {
        console.error('[User] Error loading user state:', error);
        
        const recoveredData = await findBestExistingData();
        if (recoveredData) {
          console.log('[User] Recovered data from:', recoveredData.key);
          const migrated = await runMigrations(recoveredData.data, storageKey);
          await asyncStorageRetry(() => AsyncStorage.setItem(storageKey, JSON.stringify(migrated)));
          await addKnownUserKey(storageKey);
          await setLastStorageKey(storageKey);
          return migrated;
        }
      }
      
      if (authUid) {
        console.log('[User] Creating new user state for authenticated user:', authUid);
        const newState = createDefaultUserState(
          authUid,
          authDisplayName || 'MelodyPlayer',
          authEmail ?? null
        );
        await asyncStorageRetry(() => AsyncStorage.setItem(storageKey, JSON.stringify(newState)));
        await addKnownUserKey(storageKey);
        await setLastStorageKey(storageKey);
        return newState;
      }
      
      if (!guestId) {
        console.error('[User] No guestId available, this should not happen!');
        throw new Error('Guest ID not loaded');
      }
      
      console.log('[User] Creating new guest state for:', guestId);
      const newState = createDefaultUserState(guestId, 'MelodyPlayer', null);
      await asyncStorageRetry(() => AsyncStorage.setItem(storageKey, JSON.stringify(newState)));
      await addKnownUserKey(storageKey);
      await setLastStorageKey(storageKey);
      console.log('[User] Saved new guest state to:', storageKey);
      return newState;
    },
    enabled: (isGuestIdLoaded && !!guestId) || !!authUser?.uid,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  const isDataReady = !userQuery.isLoading && userQuery.data && !isFallbackState(userQuery.data);

  const { mutate: saveUserState } = useMutation({
    mutationFn: async (state: UserState) => {
      if (isFallbackState(state)) {
        console.warn('[User] BLOCKED: Attempted to save fallback state - this would erase real data!');
        throw new Error('Cannot save fallback state');
      }
      
      if (userQuery.isLoading) {
        console.warn('[User] BLOCKED: Attempted to save while data is still loading!');
        throw new Error('Cannot save while loading');
      }
      
      try {
        pendingSaveRef.current = state;
        const serialized = JSON.stringify(state);
        await asyncStorageRetry(() => AsyncStorage.setItem(storageKey, serialized));
        await addKnownUserKey(storageKey);
        await setLastStorageKey(storageKey);
        console.log('[User] Saved user state for:', state.profile.id, 'to key:', storageKey);
        console.log('[User] Saved progress:', JSON.stringify(state.progress));
        console.log('[User] Saved inventory coins:', state.inventory.coins, 'hints:', state.inventory.hints);
        
        const verification = await AsyncStorage.getItem(storageKey);
        if (verification !== serialized) {
          console.error('[User] SAVE VERIFICATION FAILED - data mismatch!');
          await asyncStorageRetry(() => AsyncStorage.setItem(storageKey, serialized));
          console.log('[User] Retried save after verification failure');
        } else {
          console.log('[User] Save verification passed');
          pendingSaveRef.current = null;
        }
        
        if (authUser?.uid && !isAnonymous) {
          await saveLocalData(authUser.uid, {
            userState: state as unknown as Record<string, unknown>,
          });
          await queueChange(authUser.uid, 'userState', 'update', state as unknown as Record<string, unknown>);
          const newStatus = await getSyncStatus(authUser.uid);
          setSyncStatus(newStatus);
        }
        
        return state;
      } catch (error) {
        console.error('[User] Error saving user state:', error);
        throw error;
      }
    },
    onSuccess: (savedState) => {
      queryClient.setQueryData(['userState', storageKey, guestId], savedState);
    },
    onError: (error) => {
      console.error('[User] Mutation error:', error);
    },
    retry: 3,
  });

  const userState = userQuery.data ?? getFallbackUserState();

  const checkAndUnlockAchievements = useCallback((currentState: UserState): Achievement[] => {
    const newUnlocks: Achievement[] = [];
    const unlockedIds = currentState.achievements.map(a => a.id);
    const { progress } = currentState;

    ACHIEVEMENTS.forEach(achievement => {
      if (unlockedIds.includes(achievement.id)) return;

      let shouldUnlock = false;

      switch (achievement.id) {
        case 'streak_7':
        case 'streak_30':
        case 'streak_100':
        case 'streak_365':
          break;
        case 'fever_10':
          shouldUnlock = progress.feverSolves >= 10;
          break;
        case 'fever_50':
          shouldUnlock = progress.feverSolves >= 50;
          break;
        case 'fever_100':
          shouldUnlock = progress.feverSolves >= 100;
          break;
        case 'fever_500':
          shouldUnlock = progress.feverSolves >= 500;
          break;
        case 'score_10k':
          shouldUnlock = progress.totalFeverPoints >= 10000;
          break;
        case 'score_100k':
          shouldUnlock = progress.totalFeverPoints >= 100000;
          break;
        case 'global_5':
          shouldUnlock = progress.countriesPlayed.length >= 5;
          break;
        case 'global_10':
          shouldUnlock = progress.countriesPlayed.length >= 10;
          break;
        case 'global_20':
          shouldUnlock = progress.countriesPlayed.length >= 20;
          break;
        case 'perfect_1':
          shouldUnlock = progress.perfectSolves >= 1;
          break;
        case 'perfect_10':
          shouldUnlock = progress.perfectSolves >= 10;
          break;
        case 'wins_50':
          shouldUnlock = progress.totalWins >= 50;
          break;
        case 'wins_100':
          shouldUnlock = progress.totalWins >= 100;
          break;
        case 'share_1':
          shouldUnlock = progress.sharesCount >= 1;
          break;
        case 'share_10':
          shouldUnlock = progress.sharesCount >= 10;
          break;
        case 'duel_1':
          shouldUnlock = progress.duelsPlayed >= 1;
          break;
        case 'duel_win_10':
          shouldUnlock = progress.duelsWon >= 10;
          break;
        case 'event_1':
          shouldUnlock = progress.eventsCompleted >= 1;
          break;
        case 'event_5':
          shouldUnlock = progress.eventsCompleted >= 5;
          break;
        case 'ugc_create':
          shouldUnlock = progress.createdMelodies >= 1;
          break;
        case 'ugc_featured':
          shouldUnlock = progress.featuredMelodies >= 1;
          break;
      }

      if (shouldUnlock) {
        newUnlocks.push(achievement);
      }
    });

    return newUnlocks;
  }, []);

  const updateProgress = useCallback((updates: Partial<UserProgress>) => {
    if (!isDataReady) {
      console.warn('[User] Skipping updateProgress - data not ready yet');
      return;
    }
    
    const newState: UserState = {
      ...userState,
      progress: { ...userState.progress, ...updates },
    };

    const newUnlocks = checkAndUnlockAchievements(newState);
    if (newUnlocks.length > 0) {
      newState.achievements = [
        ...newState.achievements,
        ...newUnlocks.map(a => ({ id: a.id, unlockedAt: new Date().toISOString() })),
      ];
      setNewAchievement(newUnlocks[0]);
    }

    saveUserState(newState);
  }, [userState, checkAndUnlockAchievements, saveUserState, isDataReady]);

  const checkStreakAchievement = useCallback((streak: number) => {
    if (!isDataReady) {
      console.warn('[User] Skipping checkStreakAchievement - data not ready yet');
      return;
    }
    
    const newState = { ...userState };
    const unlockedIds = newState.achievements.map(a => a.id);
    const newUnlocks: Achievement[] = [];

    if (streak >= 7 && !unlockedIds.includes('streak_7')) {
      const ach = ACHIEVEMENTS.find(a => a.id === 'streak_7');
      if (ach) newUnlocks.push(ach);
    }
    if (streak >= 30 && !unlockedIds.includes('streak_30')) {
      const ach = ACHIEVEMENTS.find(a => a.id === 'streak_30');
      if (ach) newUnlocks.push(ach);
    }
    if (streak >= 100 && !unlockedIds.includes('streak_100')) {
      const ach = ACHIEVEMENTS.find(a => a.id === 'streak_100');
      if (ach) newUnlocks.push(ach);
    }
    if (streak >= 365 && !unlockedIds.includes('streak_365')) {
      const ach = ACHIEVEMENTS.find(a => a.id === 'streak_365');
      if (ach) newUnlocks.push(ach);
    }

    if (newUnlocks.length > 0) {
      newState.achievements = [
        ...newState.achievements,
        ...newUnlocks.map(a => ({ id: a.id, unlockedAt: new Date().toISOString() })),
      ];
      setNewAchievement(newUnlocks[0]);
      saveUserState(newState);
    }
  }, [userState, saveUserState, isDataReady]);

  const addCoins = useCallback((amount: number) => {
    if (!isDataReady) {
      console.warn('[User] Skipping addCoins - data not ready yet');
      return;
    }
    
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        coins: userState.inventory.coins + amount,
      },
    };
    saveUserState(newState);
  }, [userState, saveUserState, isDataReady]);

  const spendCoins = useCallback((amount: number): boolean => {
    if (!isDataReady) {
      console.warn('[User] Skipping spendCoins - data not ready yet');
      return false;
    }
    
    if (userState.inventory.coins < amount) return false;
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        coins: userState.inventory.coins - amount,
      },
    };
    saveUserState(newState);
    return true;
  }, [userState, saveUserState, isDataReady]);

  const addHints = useCallback((amount: number) => {
    if (!isDataReady) {
      console.warn('[User] Skipping addHints - data not ready yet');
      return;
    }
    
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        hints: userState.inventory.hints + amount,
      },
    };
    saveUserState(newState);
  }, [userState, saveUserState, isDataReady]);

  const useHint = useCallback((): boolean => {
    if (!isDataReady) {
      console.warn('[User] Skipping useHint - data not ready yet');
      return false;
    }
    
    if (userState.inventory.hints < 1) return false;
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        hints: userState.inventory.hints - 1,
      },
    };
    saveUserState(newState);
    return true;
  }, [userState, saveUserState, isDataReady]);

  const purchaseSkin = useCallback((skinId: string): boolean => {
    if (userState.inventory.ownedSkins.includes(skinId)) return false;
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        ownedSkins: [...userState.inventory.ownedSkins, skinId],
      },
    };
    saveUserState(newState);
    return true;
  }, [userState, saveUserState]);

  const equipSkin = useCallback((skinId: string) => {
    if (!userState.inventory.ownedSkins.includes(skinId)) return;
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        equippedSkin: skinId,
      },
    };
    saveUserState(newState);
  }, [userState, saveUserState]);

  const purchaseTheme = useCallback((themeId: string): boolean => {
    if (userState.inventory.ownedThemes?.includes(themeId)) return false;
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        ownedThemes: [...(userState.inventory.ownedThemes || ['default']), themeId],
      },
    };
    saveUserState(newState);
    return true;
  }, [userState, saveUserState]);

  const equipTheme = useCallback((themeId: string) => {
    if (!userState.inventory.ownedThemes?.includes(themeId)) return;
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        equippedTheme: themeId,
      },
    };
    saveUserState(newState);
  }, [userState, saveUserState]);

  const purchaseCosmetic = useCallback((cosmeticId: string): boolean => {
    if (userState.inventory.ownedCosmetics?.includes(cosmeticId)) return false;
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        ownedCosmetics: [...(userState.inventory.ownedCosmetics || []), cosmeticId],
      },
    };
    saveUserState(newState);
    return true;
  }, [userState, saveUserState]);

  const equipCosmetic = useCallback((cosmeticId: string, slot: 'badge' | 'frame' | 'title' | 'watermark' | 'avatarEffect') => {
    if (!userState.inventory.ownedCosmetics?.includes(cosmeticId)) return;
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        equippedCosmetics: {
          ...(userState.inventory.equippedCosmetics || { badge: null, frame: null, title: null, watermark: null, avatarEffect: null }),
          [slot]: cosmeticId,
        },
      },
    };
    saveUserState(newState);
  }, [userState, saveUserState]);

  const unequipCosmetic = useCallback((slot: 'badge' | 'frame' | 'title' | 'watermark' | 'avatarEffect') => {
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        equippedCosmetics: {
          ...(userState.inventory.equippedCosmetics || { badge: null, frame: null, title: null, watermark: null, avatarEffect: null }),
          [slot]: null,
        },
      },
    };
    saveUserState(newState);
  }, [userState, saveUserState]);

  const purchasePowerUp = useCallback((powerUpId: string, quantity: number = 1): boolean => {
    const currentOwned = userState.inventory.ownedPowerUps || {};
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        ownedPowerUps: {
          ...currentOwned,
          [powerUpId]: (currentOwned[powerUpId] || 0) + quantity,
        },
      },
    };
    saveUserState(newState);
    return true;
  }, [userState, saveUserState]);

  const usePowerUp = useCallback((powerUpId: string): boolean => {
    const currentOwned = userState.inventory.ownedPowerUps || {};
    if (!currentOwned[powerUpId] || currentOwned[powerUpId] < 1) return false;
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        ownedPowerUps: {
          ...currentOwned,
          [powerUpId]: currentOwned[powerUpId] - 1,
        },
      },
    };
    saveUserState(newState);
    return true;
  }, [userState, saveUserState]);

  const purchaseLearningPack = useCallback((packId: string): boolean => {
    if (userState.inventory.ownedLearningPacks?.includes(packId)) return false;
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        ownedLearningPacks: [...(userState.inventory.ownedLearningPacks || []), packId],
      },
    };
    saveUserState(newState);
    return true;
  }, [userState, saveUserState]);

  const purchaseInstrumentAddon = useCallback((addonId: string): boolean => {
    if (userState.inventory.ownedInstrumentAddons?.includes(addonId)) return false;
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        ownedInstrumentAddons: [...(userState.inventory.ownedInstrumentAddons || []), addonId],
      },
    };
    saveUserState(newState);
    return true;
  }, [userState, saveUserState]);

  const purchaseBundle = useCallback((bundleId: string, itemIds: string[]): boolean => {
    if (userState.inventory.ownedBundles?.includes(bundleId)) return false;
    const newOwnedSkins = [...userState.inventory.ownedSkins];
    const newOwnedThemes = [...(userState.inventory.ownedThemes || ['default'])];
    const newOwnedCosmetics = [...(userState.inventory.ownedCosmetics || [])];
    const newOwnedPowerUps = { ...(userState.inventory.ownedPowerUps || {}) };
    
    itemIds.forEach(itemId => {
      if (itemId.startsWith('skin_') && !newOwnedSkins.includes(itemId.replace('skin_', ''))) {
        newOwnedSkins.push(itemId.replace('skin_', ''));
      } else if (itemId.startsWith('theme_') && !newOwnedThemes.includes(itemId.replace('theme_', ''))) {
        newOwnedThemes.push(itemId.replace('theme_', ''));
      } else if (!newOwnedCosmetics.includes(itemId)) {
        newOwnedCosmetics.push(itemId);
      }
    });
    
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        ownedSkins: newOwnedSkins,
        ownedThemes: newOwnedThemes,
        ownedCosmetics: newOwnedCosmetics,
        ownedPowerUps: newOwnedPowerUps,
        ownedBundles: [...(userState.inventory.ownedBundles || []), bundleId],
      },
    };
    saveUserState(newState);
    return true;
  }, [userState, saveUserState]);

  const claimDailyReward = useCallback((): { coins: number; hints?: number; bonus?: string; description?: string; streakMilestone?: { badge: string; coins: number; hints: number } } | null => {
    const today = getTodayString();
    if (userState.dailyReward.claimedToday) return null;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const isConsecutive = userState.dailyReward.lastClaimDate === yesterdayStr;
    const newConsecutiveDays = isConsecutive ? userState.dailyReward.consecutiveDays + 1 : 1;

    const reward = getDailyReward(newConsecutiveDays);
    const milestone = getStreakMilestone(newConsecutiveDays);
    
    let totalCoins = reward.coins;
    let totalHints = reward.hints || 0;
    
    if (milestone) {
      totalCoins += milestone.coins;
      totalHints += milestone.hints;
      console.log(`[User] Streak milestone reached: ${milestone.badge}`);
    }

    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        coins: userState.inventory.coins + totalCoins,
        hints: userState.inventory.hints + totalHints,
      },
      dailyReward: {
        lastClaimDate: today,
        consecutiveDays: newConsecutiveDays,
        claimedToday: true,
      },
    };

    saveUserState(newState);
    console.log(`[User] Daily reward claimed: ${totalCoins} coins, ${totalHints} hints`);
    
    return { 
      coins: reward.coins, 
      hints: reward.hints,
      bonus: reward.bonus, 
      description: reward.description,
      streakMilestone: milestone ? { badge: milestone.badge, coins: milestone.coins, hints: milestone.hints } : undefined,
    };
  }, [userState, saveUserState]);

  const updateUsername = useCallback((username: string) => {
    const newState: UserState = {
      ...userState,
      profile: {
        ...userState.profile,
        username,
      },
    };
    saveUserState(newState);
  }, [userState, saveUserState]);

  const clearAchievementPopup = useCallback(() => {
    setNewAchievement(null);
  }, []);

  useEffect(() => {
    if (!isDataReady) {
      console.log('[User] Skipping premium sync - data not ready yet');
      return;
    }
    
    if (rcIsPremium && !userState.profile.isPremium) {
      console.log('[User] Syncing premium status from RevenueCat');
      const newState: UserState = {
        ...userState,
        profile: {
          ...userState.profile,
          isPremium: true,
        },
      };
      saveUserState(newState);
    }
  }, [rcIsPremium, userState, saveUserState, isDataReady]);

  const isPremium = rcIsPremium || userState.profile.isPremium;

  const triggerSync = useCallback(async () => {
    if (!authUser?.uid || isAnonymous) {
      console.log('[User] Cannot sync - no authenticated user');
      return { success: false, error: 'Not authenticated' };
    }
    
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    const result = await syncNow(authUser.uid);
    const newStatus = await getSyncStatus(authUser.uid);
    setSyncStatus(newStatus);
    return result;
  }, [authUser?.uid, isAnonymous]);

  return {
    profile: { ...userState.profile, isPremium },
    isPremium,
    inventory: {
      ...userState.inventory,
      ownedThemes: userState.inventory.ownedThemes || ['default'],
      equippedTheme: userState.inventory.equippedTheme || 'default',
      ownedCosmetics: userState.inventory.ownedCosmetics || [],
      equippedCosmetics: userState.inventory.equippedCosmetics || { badge: null, frame: null, title: null, watermark: null, avatarEffect: null },
      ownedPowerUps: userState.inventory.ownedPowerUps || {},
      ownedLearningPacks: userState.inventory.ownedLearningPacks || [],
      ownedInstrumentAddons: userState.inventory.ownedInstrumentAddons || [],
      ownedBundles: userState.inventory.ownedBundles || [],
    },
    progress: userState.progress,
    achievements: userState.achievements,
    dailyReward: userState.dailyReward,
    isLoading: userQuery.isLoading || !isGuestIdLoaded || (!authUser?.uid && !guestId),
    initError,
    newAchievement,
    isAuthenticated,
    isAnonymous,
    authUser,
    syncStatus,
    updateProgress,
    checkStreakAchievement,
    addCoins,
    spendCoins,
    addHints,
    useHint,
    purchaseSkin,
    equipSkin,
    purchaseTheme,
    equipTheme,
    purchaseCosmetic,
    equipCosmetic,
    unequipCosmetic,
    purchasePowerUp,
    usePowerUp,
    purchaseLearningPack,
    purchaseInstrumentAddon,
    purchaseBundle,
    claimDailyReward,
    updateUsername,
    clearAchievementPopup,
    triggerSync,
  };
});
