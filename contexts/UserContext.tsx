import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { ACHIEVEMENTS, Achievement } from '@/constants/achievements';
import { getDailyReward } from '@/constants/shop';
import { usePurchases } from './PurchasesContext';

export interface UserProfile {
  id: string;
  username: string;
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

const STORAGE_KEY = 'melodyx_user_state';

const DEFAULT_USER_STATE: UserState = {
  profile: {
    id: `user_${Date.now()}`,
    username: 'MelodyPlayer',
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

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export const [UserProvider, useUser] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const { isPremium: rcIsPremium } = usePurchases();

  const userQuery = useQuery({
    queryKey: ['userState'],
    queryFn: async (): Promise<UserState> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as UserState;
          const today = getTodayString();
          if (parsed.dailyReward.lastClaimDate !== today) {
            parsed.dailyReward.claimedToday = false;
          }
          return parsed;
        }
      } catch (error) {
        console.log('Error loading user state:', error);
      }
      return DEFAULT_USER_STATE;
    },
  });

  const { mutate: saveUserState } = useMutation({
    mutationFn: async (state: UserState) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userState'] });
    },
  });

  const userState = userQuery.data ?? DEFAULT_USER_STATE;

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
  }, [userState, checkAndUnlockAchievements, saveUserState]);

  const checkStreakAchievement = useCallback((streak: number) => {
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
  }, [userState, saveUserState]);

  const addCoins = useCallback((amount: number) => {
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        coins: userState.inventory.coins + amount,
      },
    };
    saveUserState(newState);
  }, [userState, saveUserState]);

  const spendCoins = useCallback((amount: number): boolean => {
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
  }, [userState, saveUserState]);

  const addHints = useCallback((amount: number) => {
    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        hints: userState.inventory.hints + amount,
      },
    };
    saveUserState(newState);
  }, [userState, saveUserState]);

  const useHint = useCallback((): boolean => {
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
  }, [userState, saveUserState]);

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

  const claimDailyReward = useCallback((): { coins: number; bonus?: string } | null => {
    const today = getTodayString();
    if (userState.dailyReward.claimedToday) return null;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const isConsecutive = userState.dailyReward.lastClaimDate === yesterdayStr;
    const newConsecutiveDays = isConsecutive ? userState.dailyReward.consecutiveDays + 1 : 1;

    const reward = getDailyReward(newConsecutiveDays);

    const newState: UserState = {
      ...userState,
      inventory: {
        ...userState.inventory,
        coins: userState.inventory.coins + reward.coins,
        hints: reward.bonus === 'free_hint' ? userState.inventory.hints + 1 : userState.inventory.hints,
      },
      dailyReward: {
        lastClaimDate: today,
        consecutiveDays: newConsecutiveDays,
        claimedToday: true,
      },
    };

    saveUserState(newState);
    return { coins: reward.coins, bonus: reward.bonus };
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
    if (rcIsPremium && !userState.profile.isPremium) {
      const newState: UserState = {
        ...userState,
        profile: {
          ...userState.profile,
          isPremium: true,
        },
      };
      saveUserState(newState);
    }
  }, [rcIsPremium, userState, saveUserState]);

  const isPremium = rcIsPremium || userState.profile.isPremium;

  return {
    profile: { ...userState.profile, isPremium },
    isPremium,
    inventory: userState.inventory,
    progress: userState.progress,
    achievements: userState.achievements,
    dailyReward: userState.dailyReward,
    isLoading: userQuery.isLoading,
    newAchievement,
    updateProgress,
    checkStreakAchievement,
    addCoins,
    spendCoins,
    addHints,
    useHint,
    purchaseSkin,
    equipSkin,
    claimDailyReward,
    updateUsername,
    clearAchievementPopup,
  };
});
