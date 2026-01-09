import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
  PurchasesError,
} from 'react-native-purchases';

function getRCApiKey(): string {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '';
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '',
  }) || '';
}

const apiKey = getRCApiKey();
let isConfigured = false;

if (apiKey && !isConfigured) {
  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    isConfigured = true;
    console.log('[RevenueCat] Configured successfully');
  } catch (error) {
    console.error('[RevenueCat] Configuration error:', error);
  }
}

export interface PurchaseResult {
  success: boolean;
  error?: string;
  productIdentifier?: string;
}

export const [PurchasesProvider, usePurchases] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const customerInfoQuery = useQuery({
    queryKey: ['customerInfo'],
    queryFn: async (): Promise<CustomerInfo | null> => {
      if (!isConfigured) {
        console.log('[RevenueCat] Not configured, skipping customer info fetch');
        return null;
      }
      try {
        const info = await Purchases.getCustomerInfo();
        console.log('[RevenueCat] Customer info fetched:', info.activeSubscriptions);
        return info;
      } catch (error) {
        console.error('[RevenueCat] Error fetching customer info:', error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
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
        return { success: false, error: 'RevenueCat not configured' };
      }
      
      setIsPurchasing(true);
      try {
        await Purchases.purchasePackage(pkg);
        console.log('[RevenueCat] Purchase successful:', pkg.identifier);
        
        queryClient.invalidateQueries({ queryKey: ['customerInfo'] });
        
        return {
          success: true,
          productIdentifier: pkg.product.identifier,
        };
      } catch (err) {
        const purchaseError = err as PurchasesError;
        console.error('[RevenueCat] Purchase error:', purchaseError);
        
        if (purchaseError.userCancelled) {
          return { success: false, error: 'cancelled' };
        }
        
        return {
          success: false,
          error: purchaseError.message || 'Purchase failed',
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

  const isPremium = customerInfo?.entitlements.active['premium']?.isActive ?? false;

  const hasPremiumEntitlement = useCallback(() => {
    return customerInfo?.entitlements.active['premium']?.isActive ?? false;
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
    return currentOffering?.monthly ?? getPackageByIdentifier('monthly');
  }, [currentOffering, getPackageByIdentifier]);

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
    purchasePackage,
    restorePurchases,
    getPackageByIdentifier,
    getMonthlyPackage,
    refreshCustomerInfo,
  };
});
