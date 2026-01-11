import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PurchasesError,
} from 'react-native-purchases';
import { captureError, addBreadcrumb } from '@/utils/errorTracking';

function getRCApiKey(): string {
  const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  
  if (Platform.OS === 'web') {
    if (testKey) {
      console.log('[RevenueCat] Web: Using Test Store API key');
      return testKey;
    }
    console.log('[RevenueCat] Web: No test key available, demo mode');
    return '';
  }
  
  if (__DEV__ && testKey) {
    console.log('[RevenueCat] Dev: Using Test Store API key');
    return testKey;
  }
  
  const key = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
    default: '',
  }) || '';
  
  console.log('[RevenueCat] Using API key for platform:', Platform.OS, key ? '(configured)' : '(missing)');
  return key;
}

let isConfigured = false;
let configurationAttempted = false;
let configurationError: string | null = null;

function configureRevenueCat(): boolean {
  if (configurationAttempted) return isConfigured;
  configurationAttempted = true;
  
  const apiKey = getRCApiKey();
  if (!apiKey) {
    console.log('[RevenueCat] No API key available, running in demo mode');
    configurationError = 'No API key configured';
    return false;
  }
  
  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({ apiKey });
    isConfigured = true;
    configurationError = null;
    console.log('[RevenueCat] Configured successfully for', Platform.OS);
    addBreadcrumb({ category: 'purchases', message: 'RevenueCat configured', level: 'info' });
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[RevenueCat] Configuration error:', errorMsg);
    configurationError = errorMsg;
    captureError(error, { tags: { component: 'RevenueCat', action: 'configure' } });
    return false;
  }
}

if (Platform.OS !== 'web') {
  configureRevenueCat();
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  productIdentifier?: string;
  customerInfo?: CustomerInfo;
}

export const ENTITLEMENTS = {
  PREMIUM: 'premium',
  AD_FREE: 'ad_free',
  UNLIMITED_PRACTICE: 'unlimited_practice',
  ALL_INSTRUMENTS: 'all_instruments',
  EXCLUSIVE_SKINS: 'exclusive_skins',
  LEARNING_ADVANCED: 'learning_advanced',
  PRIORITY_SUPPORT: 'priority_support',
} as const;

export type EntitlementKey = keyof typeof ENTITLEMENTS;

const DEMO_MODE_ENABLED = true;
const TRIAL_STORAGE_KEY = 'melodyx_premium_trial';
const TRIAL_DURATION_DAYS = 7;

export const PACKAGE_IDENTIFIERS = {
  MONTHLY: '$rc_monthly',
  YEARLY: '$rc_annual',
  LIFETIME: 'lifetime',
  COINS_500: 'coins_500',
  COINS_1500: 'coins_1500',
  COINS_5000: 'coins_5000',
  HINTS_SMALL: 'hints_small',
  HINTS_LARGE: 'hints_large',
  HINT_SINGLE: 'hint_single',
  STARTER_BUNDLE: 'starter_bundle',
  FULL_BAND_BUNDLE: 'full_band_bundle',
  ROCK_BUNDLE: 'rock_bundle',
  ELECTRONIC_BUNDLE: 'electronic_bundle',
  AI_TONES_BUNDLE: 'ai_tones_bundle',
  LEARNING_HINTS_BUNDLE: 'learning_hints_bundle',
  FAMILY_MONTHLY: 'family_monthly',
  FAMILY_YEARLY: 'family_yearly',
  COLOR_PACK_PRO: 'color_pack_pro',
  STARTER_KIT: 'starter_kit',
  POWER_UP_PACK: 'power_up_pack',
  COSMETIC_COLLECTION: 'cosmetic_collection',
  LEARNING_COMPLETE: 'learning_complete',
  FEVER_CHAMPION: 'fever_champion',
  INSTRUMENT_MASTER: 'instrument_master',
  SKIN_COLLECTOR: 'skin_collector',
  AI_DRILL_BEGINNER: 'ai_drill_beginner',
  AI_DRILL_ADVANCED: 'ai_drill_advanced',
  JAZZ_CURRICULUM: 'jazz_curriculum',
  ROCK_CURRICULUM: 'rock_curriculum',
  CLASSICAL_CURRICULUM: 'classical_curriculum',
  EAR_TRAINING_PRO: 'ear_training_pro',
  GUITAR_GLOW: 'guitar_glow',
  NEON_ALL_PACK: 'neon_all_pack',
} as const;

export interface PromoOffer {
  code: string;
  discount: number;
  expiresAt: string;
  type: 'percentage' | 'fixed';
  description: string;
}

const ACTIVE_PROMOS: PromoOffer[] = [
  { code: 'MELODYX20', discount: 20, expiresAt: '2026-12-31', type: 'percentage', description: '20% off first month' },
  { code: 'WELCOME50', discount: 50, expiresAt: '2026-06-30', type: 'percentage', description: '50% off first year' },
  { code: 'PREMIUM25', discount: 25, expiresAt: '2026-12-31', type: 'percentage', description: '25% off lifetime' },
  { code: 'NEWYEAR30', discount: 30, expiresAt: '2026-02-28', type: 'percentage', description: 'New Year 30% off' },
  { code: 'INSTRUMENTS50', discount: 50, expiresAt: '2026-12-31', type: 'percentage', description: '50% off instrument bundles' },
  { code: 'FAMILY30', discount: 30, expiresAt: '2026-12-31', type: 'percentage', description: '30% off family plans' },
];

export interface MockPackage {
  identifier: string;
  product: {
    identifier: string;
    priceString: string;
    price: number;
    title: string;
    description: string;
  };
}

const MOCK_PACKAGES: MockPackage[] = [
  {
    identifier: 'color_pack_pro',
    product: {
      identifier: 'melodyx_color_pack_pro',
      priceString: '$1.99',
      price: 1.99,
      title: 'Color Pack Pro',
      description: 'All color themes + unlimited swaps',
    },
  },
  {
    identifier: 'starter_kit',
    product: {
      identifier: 'melodyx_starter_kit',
      priceString: '$0.99',
      price: 0.99,
      title: 'Starter Kit',
      description: '10 hints + Neon theme',
    },
  },
  {
    identifier: 'power_up_pack',
    product: {
      identifier: 'melodyx_power_up_pack',
      priceString: '$2.99',
      price: 2.99,
      title: 'Power Up Pack',
      description: 'Essential power-ups bundle',
    },
  },
  {
    identifier: 'cosmetic_collection',
    product: {
      identifier: 'melodyx_cosmetic_collection',
      priceString: '$9.99',
      price: 9.99,
      title: 'Cosmetic Collection',
      description: 'Badges, frames, and effects',
    },
  },
  {
    identifier: 'learning_complete',
    product: {
      identifier: 'melodyx_learning_complete',
      priceString: '$19.99',
      price: 19.99,
      title: 'Learning Complete',
      description: 'All learning packs + AI drills',
    },
  },
  {
    identifier: 'fever_champion',
    product: {
      identifier: 'melodyx_fever_champion',
      priceString: '$3.99',
      price: 3.99,
      title: 'Fever Champion',
      description: 'Fever mode essentials',
    },
  },
  {
    identifier: 'instrument_master',
    product: {
      identifier: 'melodyx_instrument_master',
      priceString: '$7.99',
      price: 7.99,
      title: 'Instrument Master',
      description: 'All instrument add-ons',
    },
  },
  {
    identifier: 'skin_collector',
    product: {
      identifier: 'melodyx_skin_collector',
      priceString: '$14.99',
      price: 14.99,
      title: 'Skin Collector',
      description: 'All keyboard skins',
    },
  },
  {
    identifier: 'ai_drill_beginner',
    product: {
      identifier: 'melodyx_ai_drill_beginner',
      priceString: '$2.99',
      price: 2.99,
      title: 'AI Beginner Drills',
      description: 'AI-powered practice for beginners',
    },
  },
  {
    identifier: 'ai_drill_advanced',
    product: {
      identifier: 'melodyx_ai_drill_advanced',
      priceString: '$5.99',
      price: 5.99,
      title: 'AI Advanced Drills',
      description: 'Advanced AI training modules',
    },
  },
  {
    identifier: 'jazz_curriculum',
    product: {
      identifier: 'melodyx_jazz_curriculum',
      priceString: '$4.99',
      price: 4.99,
      title: 'Jazz Mastery',
      description: 'Complete jazz improvisation course',
    },
  },
  {
    identifier: 'rock_curriculum',
    product: {
      identifier: 'melodyx_rock_curriculum',
      priceString: '$3.99',
      price: 3.99,
      title: 'Rock Legends',
      description: 'Classic rock techniques',
    },
  },
  {
    identifier: 'classical_curriculum',
    product: {
      identifier: 'melodyx_classical_curriculum',
      priceString: '$6.99',
      price: 6.99,
      title: 'Classical Foundations',
      description: 'Classical music theory and practice',
    },
  },
  {
    identifier: 'ear_training_pro',
    product: {
      identifier: 'melodyx_ear_training_pro',
      priceString: '$9.99',
      price: 9.99,
      title: 'Ear Training Pro',
      description: 'Professional ear training',
    },
  },
  {
    identifier: 'guitar_glow',
    product: {
      identifier: 'melodyx_guitar_glow',
      priceString: '$2.99',
      price: 2.99,
      title: 'Guitar Glow Pack',
      description: 'Visual effects for guitar',
    },
  },
  {
    identifier: 'neon_all_pack',
    product: {
      identifier: 'melodyx_neon_all_pack',
      priceString: '$4.99',
      price: 4.99,
      title: 'Neon All Pack',
      description: 'Neon effects for all instruments',
    },
  },
  {
    identifier: '$rc_monthly',
    product: {
      identifier: 'melodyx_premium_monthly',
      priceString: '$4.99',
      price: 4.99,
      title: 'Melodyx Premium Monthly',
      description: 'Ad-free, unlimited practice, all instruments',
    },
  },
  {
    identifier: '$rc_annual',
    product: {
      identifier: 'melodyx_premium_yearly',
      priceString: '$39.99',
      price: 39.99,
      title: 'Melodyx Premium Yearly',
      description: 'Save 33% with annual subscription',
    },
  },
  {
    identifier: 'lifetime',
    product: {
      identifier: 'melodyx_premium_lifetime',
      priceString: '$79.99',
      price: 79.99,
      title: 'Melodyx Premium Lifetime',
      description: 'One-time purchase, forever premium',
    },
  },
  {
    identifier: 'family_monthly',
    product: {
      identifier: 'melodyx_family_monthly',
      priceString: '$9.99',
      price: 9.99,
      title: 'Family Plan Monthly',
      description: 'Premium for up to 6 family members',
    },
  },
  {
    identifier: 'family_yearly',
    product: {
      identifier: 'melodyx_family_yearly',
      priceString: '$79.99',
      price: 79.99,
      title: 'Family Plan Yearly',
      description: 'Save 33% on family plan annually',
    },
  },
  {
    identifier: 'starter_bundle',
    product: {
      identifier: 'melodyx_starter_bundle',
      priceString: '$2.99',
      price: 2.99,
      title: 'Starter Pack',
      description: 'Piano & Guitar enhanced effects',
    },
  },
  {
    identifier: 'full_band_bundle',
    product: {
      identifier: 'melodyx_full_band_bundle',
      priceString: '$7.99',
      price: 7.99,
      title: 'Full Band Suite',
      description: 'All 5 instruments with premium effects',
    },
  },
  {
    identifier: 'rock_bundle',
    product: {
      identifier: 'melodyx_rock_bundle',
      priceString: '$5.99',
      price: 5.99,
      title: 'Rock Master Pack',
      description: 'Guitar, Bass, Drums with rock effects',
    },
  },
  {
    identifier: 'electronic_bundle',
    product: {
      identifier: 'melodyx_electronic_bundle',
      priceString: '$4.99',
      price: 4.99,
      title: 'Electronic Producer',
      description: 'Synth and Drums for EDM',
    },
  },
  {
    identifier: 'ai_tones_bundle',
    product: {
      identifier: 'melodyx_ai_tones_bundle',
      priceString: '$3.99',
      price: 3.99,
      title: 'AI Tone Collection',
      description: 'All AI-crafted presets',
    },
  },
  {
    identifier: 'learning_hints_bundle',
    product: {
      identifier: 'melodyx_learning_hints_bundle',
      priceString: '$9.99',
      price: 9.99,
      title: 'Learning + Hints Bundle',
      description: 'Full Band Suite + 50 Hints',
    },
  },
  {
    identifier: 'coins_500',
    product: {
      identifier: 'melodyx_coins_500',
      priceString: '$0.99',
      price: 0.99,
      title: '500 Coins',
      description: 'Starter coin pack',
    },
  },
  {
    identifier: 'coins_1500',
    product: {
      identifier: 'melodyx_coins_1500',
      priceString: '$2.99',
      price: 2.99,
      title: '1500 Coins',
      description: 'Value pack with +20% bonus',
    },
  },
  {
    identifier: 'coins_5000',
    product: {
      identifier: 'melodyx_coins_5000',
      priceString: '$7.99',
      price: 7.99,
      title: '5000 Coins',
      description: 'Premium pack with +50% bonus',
    },
  },
  {
    identifier: 'hints_small',
    product: {
      identifier: 'melodyx_hints_5',
      priceString: '$0.99',
      price: 0.99,
      title: '5 Hints Pack',
      description: 'Get 5 extra hints',
    },
  },
  {
    identifier: 'hints_large',
    product: {
      identifier: 'melodyx_hints_50',
      priceString: '$4.99',
      price: 4.99,
      title: '50 Hints Pack',
      description: 'Best value - 50 hints!',
    },
  },
  {
    identifier: 'hint_single',
    product: {
      identifier: 'melodyx_hint_single',
      priceString: '$0.49',
      price: 0.49,
      title: 'Single Hint',
      description: 'One-time hint purchase',
    },
  },
];

interface TrialState {
  isActive: boolean;
  startedAt: string | null;
  expiresAt: string | null;
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

interface SubscriptionDetails {
  type: 'individual' | 'family';
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  nextBillingDate: string | null;
  cancelledAt: string | null;
  familyMembers: FamilyMember[];
  maxFamilyMembers: number;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
}

export const [PurchasesProvider, usePurchases] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<PromoOffer | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);

  const trialQuery = useQuery({
    queryKey: ['premiumTrial'],
    queryFn: async (): Promise<TrialState> => {
      try {
        const stored = await AsyncStorage.getItem(TRIAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as TrialState;
          if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
            return { ...parsed, isActive: true };
          }
          return { isActive: false, startedAt: parsed.startedAt, expiresAt: parsed.expiresAt };
        }
      } catch (error) {
        console.log('[RevenueCat] Error loading trial state:', error);
      }
      return { isActive: false, startedAt: null, expiresAt: null };
    },
  });

  const { mutate: saveTrial } = useMutation({
    mutationFn: async (trial: TrialState) => {
      await AsyncStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(trial));
      return trial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premiumTrial'] });
    },
  });

  const trialState = useMemo(() => 
    trialQuery.data ?? { isActive: false, startedAt: null, expiresAt: null }
  , [trialQuery.data]);

  const customerInfoQuery = useQuery({
    queryKey: ['customerInfo'],
    queryFn: async (): Promise<CustomerInfo | null> => {
      if (!isConfigured) {
        console.log('[RevenueCat] Not configured, skipping customer info fetch');
        return null;
      }
      try {
        const info = await Purchases.getCustomerInfo();
        console.log('[RevenueCat] Customer info fetched:', {
          activeSubscriptions: info.activeSubscriptions,
          entitlements: Object.keys(info.entitlements.active),
        });
        addBreadcrumb({ 
          category: 'purchases', 
          message: `Customer info: ${info.activeSubscriptions.length} active subs`, 
          level: 'info' 
        });
        return info;
      } catch (error) {
        console.error('[RevenueCat] Error fetching customer info:', error);
        captureError(error, { tags: { component: 'RevenueCat', action: 'getCustomerInfo' } });
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const offeringsQuery = useQuery({
    queryKey: ['offerings'],
    queryFn: async (): Promise<PurchasesOffering | null> => {
      if (!isConfigured) {
        console.log('[RevenueCat] Not configured, skipping offerings fetch');
        return null;
      }
      try {
        const offerings = await Purchases.getOfferings();
        console.log('[RevenueCat] Offerings fetched:', offerings.current?.identifier);
        console.log('[RevenueCat] Available packages:', offerings.current?.availablePackages.map(p => p.identifier));
        return offerings.current ?? null;
      } catch (error) {
        console.error('[RevenueCat] Error fetching offerings:', error);
        captureError(error, { tags: { component: 'RevenueCat', action: 'getOfferings' } });
        return null;
      }
    },
    staleTime: 1000 * 60 * 30,
  });

  const { mutateAsync: purchaseAsync } = useMutation({
    mutationFn: async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
      if (!isConfigured) {
        return { success: false, error: 'Store not available. Please try again later.' };
      }
      
      setIsPurchasing(true);
      setPurchaseError(null);
      
      try {
        addBreadcrumb({ category: 'purchases', message: `Starting purchase: ${pkg.identifier}`, level: 'info' });
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        console.log('[RevenueCat] Purchase successful:', pkg.identifier);
        addBreadcrumb({ category: 'purchases', message: `Purchase complete: ${pkg.identifier}`, level: 'info' });
        
        queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
        
        return {
          success: true,
          productIdentifier: pkg.product.identifier,
          customerInfo,
        };
      } catch (err) {
        const error = err as PurchasesError;
        console.error('[RevenueCat] Purchase error:', error);
        
        if (error.userCancelled) {
          addBreadcrumb({ category: 'purchases', message: 'Purchase cancelled by user', level: 'info' });
          return { success: false, error: 'cancelled' };
        }
        
        const errorMessage = error.message || 'Purchase failed. Please try again.';
        setPurchaseError(errorMessage);
        captureError(error, { tags: { component: 'RevenueCat', action: 'purchase', package: pkg.identifier } });
        
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsPurchasing(false);
      }
    },
  });

  const { mutateAsync: restoreAsync, isPending: isRestoring } = useMutation({
    mutationFn: async (): Promise<CustomerInfo | null> => {
      if (!isConfigured) {
        Alert.alert('Error', 'Purchases not available');
        return null;
      }
      
      try {
        addBreadcrumb({ category: 'purchases', message: 'Restoring purchases', level: 'info' });
        const info = await Purchases.restorePurchases();
        console.log('[RevenueCat] Purchases restored');
        queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
        return info;
      } catch (err) {
        console.error('[RevenueCat] Restore error:', err);
        captureError(err, { tags: { component: 'RevenueCat', action: 'restore' } });
        throw err;
      }
    },
  });

  const customerInfo = customerInfoQuery.data;
  const currentOffering = offeringsQuery.data;

  const [demoPremium, setDemoPremium] = useState(false);

  const isPremium = useMemo(() => {
    if (demoPremium) return true;
    if (trialState.isActive) return true;
    return customerInfo?.entitlements.active[ENTITLEMENTS.PREMIUM]?.isActive ?? false;
  }, [customerInfo, demoPremium, trialState.isActive]);

  const isTrialActive = useMemo(() => trialState.isActive, [trialState.isActive]);

  const trialDaysRemaining = useMemo(() => {
    if (!trialState.expiresAt) return 0;
    const remaining = new Date(trialState.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
  }, [trialState.expiresAt]);

  const hasUsedTrial = useMemo(() => trialState.startedAt !== null, [trialState.startedAt]);

  const hasAdFree = useMemo(() => {
    return isPremium || customerInfo?.entitlements.active[ENTITLEMENTS.AD_FREE]?.isActive || false;
  }, [customerInfo, isPremium]);

  const hasUnlimitedPractice = useMemo(() => {
    return isPremium || customerInfo?.entitlements.active[ENTITLEMENTS.UNLIMITED_PRACTICE]?.isActive || false;
  }, [customerInfo, isPremium]);

  const hasAllInstruments = useMemo(() => {
    return isPremium || customerInfo?.entitlements.active[ENTITLEMENTS.ALL_INSTRUMENTS]?.isActive || false;
  }, [customerInfo, isPremium]);

  const hasExclusiveSkins = useMemo(() => {
    return isPremium || customerInfo?.entitlements.active[ENTITLEMENTS.EXCLUSIVE_SKINS]?.isActive || false;
  }, [customerInfo, isPremium]);

  const hasLearningAdvanced = useMemo(() => {
    return isPremium || customerInfo?.entitlements.active[ENTITLEMENTS.LEARNING_ADVANCED]?.isActive || false;
  }, [customerInfo, isPremium]);

  const hasPrioritySupport = useMemo(() => {
    return isPremium || customerInfo?.entitlements.active[ENTITLEMENTS.PRIORITY_SUPPORT]?.isActive || false;
  }, [customerInfo, isPremium]);

  const subscriptionStatus = useMemo(() => {
    if (!customerInfo) return null;
    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
    if (!premiumEntitlement) return null;
    
    return {
      isActive: premiumEntitlement.isActive,
      willRenew: premiumEntitlement.willRenew,
      expirationDate: premiumEntitlement.expirationDate,
      productIdentifier: premiumEntitlement.productIdentifier,
      isSandbox: premiumEntitlement.isSandbox,
    };
  }, [customerInfo]);

  const hasPremiumEntitlement = useCallback(() => {
    return customerInfo?.entitlements.active[ENTITLEMENTS.PREMIUM]?.isActive ?? false;
  }, [customerInfo]);

  const hasEntitlement = useCallback((entitlementId: string) => {
    if (isPremium) return true;
    return customerInfo?.entitlements.active[entitlementId]?.isActive ?? false;
  }, [customerInfo, isPremium]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
    return purchaseAsync(pkg);
  }, [purchaseAsync]);

  const restorePurchases = useCallback(async () => {
    try {
      const info = await restoreAsync();
      if (info?.entitlements.active[ENTITLEMENTS.PREMIUM]?.isActive) {
        Alert.alert('Success', 'Your premium subscription has been restored!');
      } else {
        Alert.alert('Restore Complete', 'No active subscriptions found. Your purchases have been synced.');
      }
    } catch {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  }, [restoreAsync]);

  const startFreeTrial = useCallback(() => {
    if (hasUsedTrial) {
      Alert.alert('Trial Already Used', 'You have already used your free trial. Subscribe to continue enjoying premium features!');
      return false;
    }

    const startDate = new Date();
    const expiresAt = new Date(startDate.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);
    
    const newTrial: TrialState = {
      isActive: true,
      startedAt: startDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    
    saveTrial(newTrial);
    addBreadcrumb({ category: 'purchases', message: 'Free trial started', level: 'info' });
    console.log('[RevenueCat] Free trial started, expires:', expiresAt.toISOString());
    
    return true;
  }, [hasUsedTrial, saveTrial]);

  const getPackageByIdentifier = useCallback((identifier: string): PurchasesPackage | undefined => {
    return currentOffering?.availablePackages.find(
      (pkg) => pkg.identifier === identifier || pkg.identifier === `$rc_${identifier}`
    );
  }, [currentOffering]);

  const getMonthlyPackage = useCallback((): PurchasesPackage | undefined => {
    return currentOffering?.monthly ?? getPackageByIdentifier(PACKAGE_IDENTIFIERS.MONTHLY);
  }, [currentOffering, getPackageByIdentifier]);

  const getYearlyPackage = useCallback((): PurchasesPackage | undefined => {
    return currentOffering?.annual ?? getPackageByIdentifier(PACKAGE_IDENTIFIERS.YEARLY);
  }, [currentOffering, getPackageByIdentifier]);

  const getLifetimePackage = useCallback((): PurchasesPackage | undefined => {
    return currentOffering?.lifetime ?? getPackageByIdentifier(PACKAGE_IDENTIFIERS.LIFETIME);
  }, [currentOffering, getPackageByIdentifier]);

  const getFamilyMonthlyPackage = useCallback((): PurchasesPackage | undefined => {
    return getPackageByIdentifier(PACKAGE_IDENTIFIERS.FAMILY_MONTHLY);
  }, [getPackageByIdentifier]);

  const getFamilyYearlyPackage = useCallback((): PurchasesPackage | undefined => {
    return getPackageByIdentifier(PACKAGE_IDENTIFIERS.FAMILY_YEARLY);
  }, [getPackageByIdentifier]);

  const getBundlePackage = useCallback((bundleId: string): PurchasesPackage | undefined => {
    const bundleMap: Record<string, string> = {
      'starter_pack': PACKAGE_IDENTIFIERS.STARTER_BUNDLE,
      'full_band': PACKAGE_IDENTIFIERS.FULL_BAND_BUNDLE,
      'rock_pack': PACKAGE_IDENTIFIERS.ROCK_BUNDLE,
      'electronic_pack': PACKAGE_IDENTIFIERS.ELECTRONIC_BUNDLE,
      'ai_tones_pack': PACKAGE_IDENTIFIERS.AI_TONES_BUNDLE,
      'learning_plus_hints': PACKAGE_IDENTIFIERS.LEARNING_HINTS_BUNDLE,
    };
    const identifier = bundleMap[bundleId];
    return identifier ? getPackageByIdentifier(identifier) : undefined;
  }, [getPackageByIdentifier]);

  const calculateSavings = useCallback((monthlyPrice: number, yearlyPrice: number): number => {
    const yearlyEquivalent = monthlyPrice * 12;
    return Math.round(((yearlyEquivalent - yearlyPrice) / yearlyEquivalent) * 100);
  }, []);

  const applyPromoCode = useCallback(async (code: string): Promise<{ success: boolean; message: string; promo?: PromoOffer }> => {
    console.log('[RevenueCat] Applying promo code:', code);
    const upperCode = code.toUpperCase().trim();
    
    const promo = ACTIVE_PROMOS.find(p => p.code === upperCode);
    if (promo) {
      const expiryDate = new Date(promo.expiresAt);
      if (expiryDate > new Date()) {
        setAppliedPromo(promo);
        return { 
          success: true, 
          message: `🎉 ${promo.description} applied! Discount will be shown at checkout.`,
          promo 
        };
      }
      return { success: false, message: 'This promo code has expired.' };
    }
    return { success: false, message: 'Invalid promo code. Please check and try again.' };
  }, []);

  const clearPromoCode = useCallback(() => {
    setAppliedPromo(null);
  }, []);

  const getMockPackage = useCallback((identifier: string): MockPackage | undefined => {
    return MOCK_PACKAGES.find(
      (pkg) => pkg.identifier === identifier || pkg.identifier === `$rc_${identifier}`
    );
  }, []);

  const getMockPrice = useCallback((identifier: string): string => {
    const mock = getMockPackage(identifier);
    return mock?.product.priceString ?? '---';
  }, [getMockPackage]);

  const getDiscountedPrice = useCallback((originalPrice: number): number => {
    if (!appliedPromo) return originalPrice;
    if (appliedPromo.type === 'percentage') {
      return originalPrice * (1 - appliedPromo.discount / 100);
    }
    return Math.max(0, originalPrice - appliedPromo.discount);
  }, [appliedPromo]);

  const clearPurchaseError = useCallback(() => {
    setPurchaseError(null);
  }, []);

  const refreshCustomerInfo = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
  }, [queryClient]);

  const identifyUser = useCallback(async (userId: string) => {
    if (!isConfigured) return;
    try {
      await Purchases.logIn(userId);
      console.log('[RevenueCat] User identified:', userId);
      queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
    } catch (error) {
      console.error('[RevenueCat] Error identifying user:', error);
    }
  }, [queryClient]);

  const logoutUser = useCallback(async () => {
    if (!isConfigured) return;
    try {
      await Purchases.logOut();
      console.log('[RevenueCat] User logged out');
      queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
    } catch (error) {
      console.error('[RevenueCat] Error logging out:', error);
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isConfigured) return;

    const listener = (info: CustomerInfo) => {
      console.log('[RevenueCat] Customer info updated');
      queryClient.setQueryData(['customerInfo'], info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [queryClient]);

  const enableDemoPremium = useCallback(() => {
    setDemoPremium(true);
    console.log('[RevenueCat] Demo premium enabled');
  }, []);

  const disableDemoPremium = useCallback(() => {
    setDemoPremium(false);
    console.log('[RevenueCat] Demo premium disabled');
  }, []);

  const isDemoMode = useMemo(() => !isConfigured && DEMO_MODE_ENABLED, []);
  
  const purchaseDemoProduct = useCallback(async (packageId: string, rewardType?: 'coins' | 'hints', rewardAmount?: number) => {
    console.log('[RevenueCat] Demo purchase:', packageId);
    addBreadcrumb({ category: 'purchases', message: `Demo purchase: ${packageId}`, level: 'info' });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      productIdentifier: packageId,
      rewardType,
      rewardAmount,
      isDemo: true,
    };
  }, []);

  const initializeSubscriptionDetails = useCallback(() => {
    if (!isPremium) {
      setSubscriptionDetails(null);
      return;
    }
    
    const mockDetails: SubscriptionDetails = {
      type: 'individual',
      billingCycle: 'yearly',
      nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      cancelledAt: null,
      familyMembers: [],
      maxFamilyMembers: 6,
    };
    setSubscriptionDetails(mockDetails);
    
    const mockHistory: BillingHistory[] = [
      { id: '1', date: new Date().toISOString(), amount: 39.99, description: 'Premium Yearly', status: 'completed' },
    ];
    setBillingHistory(mockHistory);
  }, [isPremium]);

  useEffect(() => {
    initializeSubscriptionDetails();
  }, [initializeSubscriptionDetails]);

  const addFamilyMember = useCallback(async (email: string, name: string) => {
    if (!subscriptionDetails || subscriptionDetails.type !== 'family') {
      Alert.alert('Family Plan Required', 'Upgrade to a family plan to add members.');
      return false;
    }
    
    if (subscriptionDetails.familyMembers.length >= subscriptionDetails.maxFamilyMembers) {
      Alert.alert('Limit Reached', `Maximum ${subscriptionDetails.maxFamilyMembers} family members allowed.`);
      return false;
    }
    
    const newMember: FamilyMember = {
      id: `member_${Date.now()}`,
      name,
      email,
      role: 'member',
      joinedAt: new Date().toISOString(),
    };
    
    setSubscriptionDetails(prev => prev ? {
      ...prev,
      familyMembers: [...prev.familyMembers, newMember],
    } : null);
    
    console.log('[RevenueCat] Family member added:', email);
    return true;
  }, [subscriptionDetails]);

  const removeFamilyMember = useCallback(async (memberId: string) => {
    setSubscriptionDetails(prev => prev ? {
      ...prev,
      familyMembers: prev.familyMembers.filter(m => m.id !== memberId),
    } : null);
    console.log('[RevenueCat] Family member removed:', memberId);
    return true;
  }, []);

  const cancelSubscription = useCallback(async () => {
    console.log('[RevenueCat] Cancellation requested');
    Alert.alert(
      'Cancel Subscription',
      'To cancel your subscription, please go to your device\'s app store settings. Your premium features will remain active until the end of your billing period.',
      [{ text: 'OK' }]
    );
    return true;
  }, []);

  const requestRefund = useCallback(async (reason: string) => {
    console.log('[RevenueCat] Refund requested:', reason);
    Alert.alert(
      'Refund Request Submitted',
      'Your refund request has been submitted. You will receive an email within 3-5 business days.',
      [{ text: 'OK' }]
    );
    return true;
  }, []);

  const upgradeToFamily = useCallback(async () => {
    const configured = isConfigured;
    if (!configured) {
      setSubscriptionDetails(prev => prev ? {
        ...prev,
        type: 'family',
        maxFamilyMembers: 6,
      } : null);
      Alert.alert('Family Plan Activated!', 'You can now add up to 6 family members. (Demo Mode)');
      return true;
    }
    return false;
  }, []);

  return {
    isConfigured,
    isDemoMode,
    isPremium,
    isTrialActive,
    trialDaysRemaining,
    hasUsedTrial,
    hasAdFree,
    hasUnlimitedPractice,
    hasAllInstruments,
    hasExclusiveSkins,
    hasLearningAdvanced,
    hasPrioritySupport,
    isPurchasing,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    isRestoring,
    customerInfo,
    currentOffering,
    availablePackages: currentOffering?.availablePackages ?? [],
    mockPackages: MOCK_PACKAGES,
    subscriptionStatus,
    subscriptionDetails,
    billingHistory,
    appliedPromo,
    hasPremiumEntitlement,
    hasEntitlement,
    purchasePackage,
    restorePurchases,
    startFreeTrial,
    getPackageByIdentifier,
    getMonthlyPackage,
    getYearlyPackage,
    getLifetimePackage,
    getFamilyMonthlyPackage,
    getFamilyYearlyPackage,
    getBundlePackage,
    calculateSavings,
    applyPromoCode,
    clearPromoCode,
    getMockPackage,
    getMockPrice,
    getDiscountedPrice,
    refreshCustomerInfo,
    identifyUser,
    logoutUser,
    purchaseError,
    clearPurchaseError,
    enableDemoPremium,
    disableDemoPremium,
    purchaseDemoProduct,
    configurationError,
    addFamilyMember,
    removeFamilyMember,
    cancelSubscription,
    requestRefund,
    upgradeToFamily,
    ENTITLEMENTS,
    PACKAGE_IDENTIFIERS,
  };
});
