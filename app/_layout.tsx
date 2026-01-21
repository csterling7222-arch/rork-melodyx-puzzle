import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initErrorTracking, addBreadcrumb, captureError } from '@/utils/errorTracking';
import { initAccessibility } from '@/utils/accessibility';
import { initGlitchFreeEngine, logNavigation } from '@/utils/glitchFreeEngine';
import { initSystemIntegration } from '@/utils/systemIntegration';
import { initPerformanceOptimizer } from '@/utils/performanceOptimizer';
import { configureHaptics } from '@/utils/hapticEngine';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { GameProvider } from '@/contexts/GameContext';
import { FeverProvider } from '@/contexts/FeverContext';
import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DuelsProvider } from '@/contexts/DuelsContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { EcoProvider } from '@/contexts/EcoContext';
import { PlaylistProvider } from '@/contexts/PlaylistContext';
import { SocialShareProvider } from '@/contexts/SocialShareContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PurchasesProvider } from '@/contexts/PurchasesContext';
import { InstrumentProvider } from '@/contexts/InstrumentContext';
import { TuneSnippetProvider } from '@/contexts/TuneSnippetContext';
import { UserMelodiesProvider } from '@/contexts/UserMelodiesContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      console.log('[Auth] Not authenticated, redirecting to auth screen');
      router.replace('/auth');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('[Auth] Already authenticated, redirecting to tabs');
      router.replace('/(tabs)');
    }
    
    setHasChecked(true);
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading || (!hasChecked && !isAuthenticated)) {
    return null;
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <AuthGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  const [showPerfMonitor, setShowPerfMonitor] = useState(__DEV__);

  useEffect(() => {
    const verifyDataIntegrity = async () => {
      try {
        console.log('[App] Verifying data integrity...');
        const keys = await AsyncStorage.getAllKeys();
        const melodxyKeys = keys.filter(k => k.startsWith('melodyx_'));
        console.log('[App] Found', melodxyKeys.length, 'MelodyX storage keys:', melodxyKeys);
        
        const criticalKeys = [
          'melodyx_device_id',
          'melodyx_guest_id', 
          'melodyx_user_state_guest',
          'melodyx_stats',
        ];
        
        for (const key of criticalKeys) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            console.log(`[App] ✓ ${key}: exists (${value.length} chars)`);
          } else {
            console.log(`[App] ○ ${key}: not found (will be created)`);
          }
        }
        
        const guestState = await AsyncStorage.getItem('melodyx_user_state_guest');
        if (guestState) {
          try {
            const parsed = JSON.parse(guestState);
            console.log('[App] Guest state verified - ID:', parsed.profile?.id, 'Coins:', parsed.inventory?.coins);
          } catch {
            console.error('[App] Guest state corrupted, will be recreated');
          }
        }
        
        const stats = await AsyncStorage.getItem('melodyx_stats');
        if (stats) {
          try {
            const parsed = JSON.parse(stats);
            console.log('[App] Stats verified - Games:', parsed.gamesPlayed, 'Won:', parsed.gamesWon, 'Streak:', parsed.currentStreak);
          } catch {
            console.error('[App] Stats corrupted, will be recreated');
          }
        }
        
        addBreadcrumb({ category: 'storage', message: `Data integrity check complete: ${melodxyKeys.length} keys`, level: 'info' });
      } catch (error) {
        console.error('[App] Data integrity check failed:', error);
        captureError(error, { tags: { component: 'RootLayout', action: 'verifyDataIntegrity' } });
      }
    };

    const initializeApp = async () => {
      try {
        initErrorTracking();
        console.log('[App] Error tracking initialized');
        
        await verifyDataIntegrity();
        
        await Promise.all([
          initGlitchFreeEngine(),
          initSystemIntegration(),
          initPerformanceOptimizer(),
        ]);
        console.log('[App] Core engines initialized');
        logNavigation('app_launch');
        
        configureHaptics({ enabled: true, intensity: 'high' });
        console.log('[App] Haptics configured');
        
        const accessSettings = await initAccessibility();
        console.log('[App] Accessibility initialized:', accessSettings.screenReaderEnabled ? 'Screen reader active' : 'Standard mode');
        
        addBreadcrumb({ category: 'lifecycle', message: 'App launched with full integration', level: 'info' });
        
        await SplashScreen.hideAsync();
        addBreadcrumb({ category: 'lifecycle', message: 'Splash screen hidden', level: 'info' });
      } catch (error) {
        console.error('[App] Initialization error:', error);
        captureError(error, { tags: { component: 'RootLayout', action: 'initialize' } });
        
        try {
          await SplashScreen.hideAsync();
        } catch (splashError) {
          console.log('[App] Splash hide error:', splashError);
        }
      }
    };
    
    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PurchasesProvider>
            <AuthProvider>
              <InstrumentProvider>
                <ThemeProvider>
                  <UserProvider>
                  <GameProvider>
                <FeverProvider>
                  <DuelsProvider>
                    <EventsProvider>
                      <EcoProvider>
                          <PlaylistProvider>
                            <SocialShareProvider>
                              <TuneSnippetProvider>
                                <UserMelodiesProvider>
                                  <StatusBar style="light" />
                                  <RootLayoutNav />
                                  <PerformanceMonitor 
                                    visible={showPerfMonitor} 
                                    position="top-right"
                                    compact={true}
                                    onToggle={() => setShowPerfMonitor(prev => !prev)}
                                  />
                                </UserMelodiesProvider>
                              </TuneSnippetProvider>
                            </SocialShareProvider>
                            </PlaylistProvider>
                          </EcoProvider>
                        </EventsProvider>
                      </DuelsProvider>
                    </FeverProvider>
                  </GameProvider>
                  </UserProvider>
                </ThemeProvider>
              </InstrumentProvider>
            </AuthProvider>
          </PurchasesProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
