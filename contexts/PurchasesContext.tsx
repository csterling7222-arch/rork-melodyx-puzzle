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
  COINS_500: 'coins_500',
  COINS_1500: 'coins_1500',
  COINS_5000: 'coins_5000',
  HINTS_SMALL: 'hints_small',
  HINTS_LARGE: 'hints_large',
} as const;

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
    hasPremiumEntitlement,
    hasEntitlement,
    purchasePackage,
    restorePurchases,
    getPackageByIdentifier,
    getMonthlyPackage,
    refreshCustomerInfo,
    purchaseError,
    clearPurchaseError,
    ENTITLEMENTS,
    PACKAGE_IDENTIFIERS,
  };
});
