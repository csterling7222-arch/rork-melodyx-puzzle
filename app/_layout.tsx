import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
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
import { AuthProvider } from '@/contexts/AuthContext';
import { DuelsProvider } from '@/contexts/DuelsContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { EcoProvider } from '@/contexts/EcoContext';
import { PlaylistProvider } from '@/contexts/PlaylistContext';
import { SocialShareProvider } from '@/contexts/SocialShareContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PurchasesProvider } from '@/contexts/PurchasesContext';
import { InstrumentProvider } from '@/contexts/InstrumentContext';
import { TuneSnippetProvider } from '@/contexts/TuneSnippetContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [showPerfMonitor, setShowPerfMonitor] = useState(__DEV__);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        initErrorTracking();
        console.log('[App] Error tracking initialized');
        
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
                                <StatusBar style="light" />
                                <RootLayoutNav />
                                <PerformanceMonitor 
                                  visible={showPerfMonitor} 
                                  position="top-right"
                                  compact={true}
                                  onToggle={() => setShowPerfMonitor(prev => !prev)}
                                />
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
