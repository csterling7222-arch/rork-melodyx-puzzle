import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Platform, Share } from 'react-native';
import * as Haptics from 'expo-haptics';
import { usePurchases } from './PurchasesContext';
import { useUser } from './UserContext';
import {
  ShareAnalytics,
  SHARE_LIMITS,
  SHARE_PLATFORMS,
  SharePlatform,
  TRENDING_HASHTAGS,
  PLATFORM_SPECIFIC_HASHTAGS,
  AI_CAPTION_PROMPTS,
} from '@/constants/socialShare';
import { generateText } from '@rork-ai/toolkit-sdk';

const STORAGE_KEY = 'melodyx_social_share_state';
const ANALYTICS_KEY = 'melodyx_share_analytics';
const OFFLINE_QUEUE_KEY = 'melodyx_share_offline_queue';

interface ShareState {
  dailyShareCount: number;
  lastShareDate: string;
  totalShares: number;
  platformShares: Record<string, number>;
  favoriteTemplates: string[];
  recentStickers: string[];
  shareStreak: number;
  lastShareTimestamp: string | null;
}

interface QueuedShare {
  id: string;
  platform: string;
  content: string;
  mediaType: 'text' | 'image' | 'video';
  timestamp: string;
  metadata: Record<string, unknown>;
}

interface ShareLeaderboardEntry {
  userId: string;
  username: string;
  totalShares: number;
  viralScore: number;
  rank: number;
}

const DEFAULT_STATE: ShareState = {
  dailyShareCount: 0,
  lastShareDate: '',
  totalShares: 0,
  platformShares: {},
  favoriteTemplates: [],
  recentStickers: [],
  shareStreak: 0,
  lastShareTimestamp: null,
};

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export const [SocialShareProvider, useSocialShare] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { isPremium } = usePurchases();
  const { profile, updateProgress } = useUser();

  const [offlineQueue, setOfflineQueue] = useState<QueuedShare[]>([]);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  const limits = useMemo(() => {
    return isPremium ? SHARE_LIMITS.premium : SHARE_LIMITS.free;
  }, [isPremium]);

  const stateQuery = useQuery({
    queryKey: ['socialShareState'],
    queryFn: async (): Promise<ShareState> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ShareState;
          const today = getTodayString();
          if (parsed.lastShareDate !== today) {
            parsed.dailyShareCount = 0;
            parsed.lastShareDate = today;
          }
          console.log('[SocialShare] Loaded state:', parsed.totalShares, 'total shares');
          return parsed;
        }
      } catch (error) {
        console.log('[SocialShare] Error loading state:', error);
      }
      return DEFAULT_STATE;
    },
  });

  const offlineQueueQuery = useQuery({
    queryKey: ['offlineShareQueue'],
    queryFn: async (): Promise<QueuedShare[]> => {
      try {
        const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        if (stored) {
          const queue = JSON.parse(stored) as QueuedShare[];
          console.log('[SocialShare] Loaded offline queue:', queue.length, 'items');
          return queue;
        }
      } catch (error) {
        console.log('[SocialShare] Error loading offline queue:', error);
      }
      return [];
    },
  });

  useEffect(() => {
    if (offlineQueueQuery.data) {
      setOfflineQueue(offlineQueueQuery.data);
    }
  }, [offlineQueueQuery.data]);

  const shareState = stateQuery.data ?? DEFAULT_STATE;

  const { mutate: saveState } = useMutation({
    mutationFn: async (state: ShareState) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialShareState'] });
    },
  });

  const { mutate: saveOfflineQueue } = useMutation({
    mutationFn: async (queue: QueuedShare[]) => {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      return queue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offlineShareQueue'] });
    },
  });

  const { mutate: trackAnalytics } = useMutation({
    mutationFn: async (analytics: ShareAnalytics) => {
      try {
        const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
        const existing: ShareAnalytics[] = stored ? JSON.parse(stored) : [];
        existing.push(analytics);
        const trimmed = existing.slice(-100);
        await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
        console.log('[SocialShare] Tracked analytics for:', analytics.platform);
      } catch (error) {
        console.log('[SocialShare] Error tracking analytics:', error);
      }
    },
  });

  const canShare = useCallback((): boolean => {
    if (limits.dailyShares === -1) return true;
    return shareState.dailyShareCount < limits.dailyShares;
  }, [shareState.dailyShareCount, limits.dailyShares]);

  const getRemainingShares = useCallback((): number => {
    if (limits.dailyShares === -1) return -1;
    return Math.max(0, limits.dailyShares - shareState.dailyShareCount);
  }, [shareState.dailyShareCount, limits.dailyShares]);

  const recordShare = useCallback((platform: string, templateId: string, analytics: Partial<ShareAnalytics>) => {
    const today = getTodayString();
    const now = new Date().toISOString();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const isConsecutive = shareState.lastShareDate === yesterdayStr || shareState.lastShareDate === today;
    const newStreak = isConsecutive ? shareState.shareStreak + 1 : 1;

    const newState: ShareState = {
      ...shareState,
      dailyShareCount: shareState.lastShareDate === today 
        ? shareState.dailyShareCount + 1 
        : 1,
      lastShareDate: today,
      totalShares: shareState.totalShares + 1,
      platformShares: {
        ...shareState.platformShares,
        [platform]: (shareState.platformShares[platform] || 0) + 1,
      },
      shareStreak: newStreak,
      lastShareTimestamp: now,
    };

    saveState(newState);

    trackAnalytics({
      platform,
      templateId,
      hasStickers: analytics.hasStickers ?? false,
      hasFilters: analytics.hasFilters ?? false,
      hasEffects: analytics.hasEffects ?? false,
      includesAudio: analytics.includesAudio ?? false,
      timestamp: now,
      shareType: analytics.shareType ?? 'text',
    });

    updateProgress({ sharesCount: (profile.id ? shareState.totalShares + 1 : 0) });

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    console.log('[SocialShare] Recorded share to:', platform, 'Total:', newState.totalShares);
  }, [shareState, saveState, trackAnalytics, updateProgress, profile.id]);

  const addToFavorites = useCallback((templateId: string) => {
    if (shareState.favoriteTemplates.includes(templateId)) return;
    
    const newState: ShareState = {
      ...shareState,
      favoriteTemplates: [...shareState.favoriteTemplates, templateId].slice(-10),
    };
    saveState(newState);
  }, [shareState, saveState]);

  const removeFromFavorites = useCallback((templateId: string) => {
    const newState: ShareState = {
      ...shareState,
      favoriteTemplates: shareState.favoriteTemplates.filter(id => id !== templateId),
    };
    saveState(newState);
  }, [shareState, saveState]);

  const addRecentSticker = useCallback((stickerId: string) => {
    const filtered = shareState.recentStickers.filter(id => id !== stickerId);
    const newState: ShareState = {
      ...shareState,
      recentStickers: [stickerId, ...filtered].slice(0, 8),
    };
    saveState(newState);
  }, [shareState, saveState]);

  const queueShareForOffline = useCallback((share: Omit<QueuedShare, 'id' | 'timestamp'>) => {
    const queuedShare: QueuedShare = {
      ...share,
      id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    const newQueue = [...offlineQueue, queuedShare];
    setOfflineQueue(newQueue);
    saveOfflineQueue(newQueue);

    console.log('[SocialShare] Queued share for offline:', queuedShare.id);
    return queuedShare.id;
  }, [offlineQueue, saveOfflineQueue]);

  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;

    console.log('[SocialShare] Processing offline queue:', offlineQueue.length, 'items');

    const processed: string[] = [];

    for (const item of offlineQueue) {
      try {
        await Share.share({
          message: item.content,
          title: 'Melodyx Share',
        });
        processed.push(item.id);
        recordShare(item.platform, 'offline', { shareType: item.mediaType });
      } catch (error) {
        console.log('[SocialShare] Failed to process queued share:', item.id, error);
      }
    }

    if (processed.length > 0) {
      const newQueue = offlineQueue.filter(item => !processed.includes(item.id));
      setOfflineQueue(newQueue);
      saveOfflineQueue(newQueue);
      console.log('[SocialShare] Processed', processed.length, 'queued shares');
    }
  }, [offlineQueue, saveOfflineQueue, recordShare]);

  const removeFromQueue = useCallback((shareId: string) => {
    const newQueue = offlineQueue.filter(item => item.id !== shareId);
    setOfflineQueue(newQueue);
    saveOfflineQueue(newQueue);
  }, [offlineQueue, saveOfflineQueue]);

  const generateAICaption = useCallback(async (context: {
    won: boolean;
    guessCount: number;
    streak: number;
    songName?: string;
    artist?: string;
    puzzleNumber: number;
    platform?: string;
  }): Promise<string> => {
    setIsGeneratingCaption(true);
    
    try {
      const prompt = `Generate a short, catchy social media caption for a music puzzle game result. Context:
- Result: ${context.won ? 'Won' : 'Lost'}
- Guesses: ${context.guessCount}/6
- Streak: ${context.streak} days
- Song: ${context.songName || 'Unknown'} by ${context.artist || 'Unknown'}
- Puzzle #${context.puzzleNumber}
- Platform: ${context.platform || 'general'}

Create a fun, engaging caption with emojis. Keep it under 200 characters. Include #Melodyx hashtag.`;

      const result = await generateText(prompt);
      
      if (result && result.length > 0) {
        console.log('[SocialShare] AI generated caption');
        return result;
      }
    } catch (error) {
      console.log('[SocialShare] AI caption generation error:', error);
    } finally {
      setIsGeneratingCaption(false);
    }

    const randomCaption = AI_CAPTION_PROMPTS[Math.floor(Math.random() * AI_CAPTION_PROMPTS.length)];
    const streakText = context.streak > 1 ? ` 🔥 ${context.streak} day streak!` : '';
    return `${randomCaption}${streakText}\n\nMelodyx #${context.puzzleNumber} ${context.won ? '✅' : ''} ${context.guessCount}/6\n\n#Melodyx`;
  }, []);

  const getHashtagsForPlatform = useCallback((platform: string, additionalTags: string[] = []): string[] => {
    const platformTags = PLATFORM_SPECIFIC_HASHTAGS[platform] || [];
    const baseTags = TRENDING_HASHTAGS.slice(0, 4);
    const allTags = [...new Set([...baseTags, ...platformTags, ...additionalTags])];
    return allTags.slice(0, 8);
  }, []);

  const getPlatformConfig = useCallback((platformId: string): SharePlatform | undefined => {
    return SHARE_PLATFORMS.find(p => p.id === platformId);
  }, []);

  const formatContentForPlatform = useCallback((content: string, platform: SharePlatform): string => {
    if (content.length <= platform.maxLength) return content;
    
    const truncated = content.substring(0, platform.maxLength - 3) + '...';
    return truncated;
  }, []);

  const getShareUrl = useCallback((platform: SharePlatform, content: string): string | null => {
    const encodedContent = encodeURIComponent(content);
    
    switch (platform.id) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedContent}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?quote=${encodedContent}`;
      case 'reddit':
        return `https://www.reddit.com/submit?title=${encodedContent}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${encodedContent}`;
      case 'tiktok':
      case 'instagram':
      case 'snapchat':
      case 'youtube':
        // These platforms don't support direct web sharing with text
        return null;
      default:
        return null;
    }
  }, []);

  const getAnalytics = useCallback(async (): Promise<ShareAnalytics[]> => {
    try {
      const stored = await AsyncStorage.getItem(ANALYTICS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const getShareLeaderboard = useCallback(async (): Promise<ShareLeaderboardEntry[]> => {
    return [
      { userId: '1', username: 'MelodyMaster', totalShares: 150, viralScore: 9500, rank: 1 },
      { userId: '2', username: 'TuneChamp', totalShares: 120, viralScore: 8200, rank: 2 },
      { userId: '3', username: 'BeatKing', totalShares: 95, viralScore: 7100, rank: 3 },
      { userId: profile.id, username: profile.username, totalShares: shareState.totalShares, viralScore: shareState.totalShares * 50, rank: 4 },
    ];
  }, [profile, shareState.totalShares]);

  const getViralScore = useCallback((): number => {
    const baseScore = shareState.totalShares * 50;
    const streakBonus = shareState.shareStreak * 100;
    const platformDiversity = Object.keys(shareState.platformShares).length * 200;
    return baseScore + streakBonus + platformDiversity;
  }, [shareState]);

  return {
    shareState,
    limits,
    offlineQueue,
    isGeneratingCaption,
    isPremium,
    isLoading: stateQuery.isLoading,
    canShare,
    getRemainingShares,
    recordShare,
    addToFavorites,
    removeFromFavorites,
    addRecentSticker,
    queueShareForOffline,
    processOfflineQueue,
    removeFromQueue,
    generateAICaption,
    getHashtagsForPlatform,
    getPlatformConfig,
    formatContentForPlatform,
    getShareUrl,
    getAnalytics,
    getShareLeaderboard,
    getViralScore,
  };
});
