import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PurchasesError,
} from 'react-native-purchases';
import { captureError } from '@/utils/errorTracking';

function getRCApiKey(): string {
  if (__DEV__ || Platform.OS === 'web') {
    const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
    if (testKey) return testKey;
  }
  const key = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '',
  }) || '';
  console.log('[RevenueCat] Using API key for platform:', Platform.OS);
  return key;
}

let isConfigured = false;
let configurationAttempted = false;

function configureRevenueCat() {
  if (configurationAttempted) return isConfigured;
  configurationAttempted = true;
  
  const apiKey = getRCApiKey();
  if (!apiKey) {
    console.log('[RevenueCat] No API key available, skipping configuration');
    return false;
  }
  
  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({ apiKey });
    isConfigured = true;
    console.log('[RevenueCat] Configured successfully');
    return true;
  } catch (error) {
    console.error('[RevenueCat] Configuration error:', error);
    captureError(error, { tags: { component: 'RevenueCat', action: 'configure' } });
    return false;
  }
}

configureRevenueCat();

export interface PurchaseResult {
  success: boolean;
  error?: string;
  productIdentifier?: string;
  customerInfo?: CustomerInfo;
}

export const ENTITLEMENTS = {
  PREMIUM: 'premium',
} as const;

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
} as const;

export interface PromoOffer {
  code: string;
  discount: number;
  expiresAt: string;
  type: 'percentage' | 'fixed';
}

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

export const [PurchasesProvider, usePurchases] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

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
        return offerings.current ?? null;
      } catch (error) {
        console.error('[RevenueCat] Error fetching offerings:', error);
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
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        console.log('[RevenueCat] Purchase successful:', pkg.identifier);
        
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
        const info = await Purchases.restorePurchases();
        console.log('[RevenueCat] Purchases restored');
        queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
        return info;
      } catch (err) {
        console.error('[RevenueCat] Restore error:', err);
        throw err;
      }
    },
  });

  const customerInfo = customerInfoQuery.data;
  const currentOffering = offeringsQuery.data;

  const isPremium = useMemo(() => {
    return customerInfo?.entitlements.active[ENTITLEMENTS.PREMIUM]?.isActive ?? false;
  }, [customerInfo]);

  const hasPremiumEntitlement = useCallback(() => {
    return customerInfo?.entitlements.active[ENTITLEMENTS.PREMIUM]?.isActive ?? false;
  }, [customerInfo]);

  const hasEntitlement = useCallback((entitlementId: string) => {
    return customerInfo?.entitlements.active[entitlementId]?.isActive ?? false;
  }, [customerInfo]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
    return purchaseAsync(pkg);
  }, [purchaseAsync]);

  const restorePurchases = useCallback(async () => {
    try {
      await restoreAsync();
      Alert.alert('Success', 'Your purchases have been restored!');
    } catch {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  }, [restoreAsync]);

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

  const calculateSavings = useCallback((monthlyPrice: number, yearlyPrice: number): number => {
    const yearlyEquivalent = monthlyPrice * 12;
    return Math.round(((yearlyEquivalent - yearlyPrice) / yearlyEquivalent) * 100);
  }, []);

  const applyPromoCode = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    console.log('[RevenueCat] Applying promo code:', code);
    if (!isConfigured) {
      return { success: false, message: 'Store not available' };
    }
    try {
      const validCodes = ['MELODYX20', 'WELCOME50', 'PREMIUM25'];
      if (validCodes.includes(code.toUpperCase())) {
        return { success: true, message: 'Promo code applied! Discount will be shown at checkout.' };
      }
      return { success: false, message: 'Invalid or expired promo code' };
    } catch (err) {
      console.error('[RevenueCat] Promo code error:', err);
      return { success: false, message: 'Failed to apply promo code' };
    }
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

  const clearPurchaseError = useCallback(() => {
    setPurchaseError(null);
  }, []);

  const refreshCustomerInfo = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
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

  return {
    isConfigured,
    isPremium,
    isPurchasing,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    isRestoring,
    customerInfo,
    currentOffering,
    availablePackages: currentOffering?.availablePackages ?? [],
    mockPackages: MOCK_PACKAGES,
    hasPremiumEntitlement,
    hasEntitlement,
    purchasePackage,
    restorePurchases,
    getPackageByIdentifier,
    getMonthlyPackage,
    getYearlyPackage,
    getLifetimePackage,
    calculateSavings,
    applyPromoCode,
    getMockPackage,
    getMockPrice,
    refreshCustomerInfo,
    purchaseError,
    clearPurchaseError,
    ENTITLEMENTS,
    PACKAGE_IDENTIFIERS,
  };
});
