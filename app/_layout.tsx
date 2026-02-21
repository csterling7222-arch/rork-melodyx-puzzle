import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === ('auth' as string);

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth' as any);
    } else if (isAuthenticated && inAuthGroup) {
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
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </AuthGate>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        initErrorTracking();

        await Promise.all([
          initGlitchFreeEngine(),
          initSystemIntegration(),
          initPerformanceOptimizer(),
        ]);
        logNavigation('app_launch');

        configureHaptics({ enabled: true, intensity: 'high' });

        await initAccessibility();

        addBreadcrumb({ category: 'lifecycle', message: 'App launched', level: 'info' });

        await SplashScreen.hideAsync();
      } catch (error) {
        captureError(error, { tags: { component: 'RootLayout', action: 'initialize' } });

        try {
          await SplashScreen.hideAsync();
        } catch {
          // splash already hidden
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
              <ThemeProvider>
                <InstrumentProvider>
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
                </InstrumentProvider>
              </ThemeProvider>
            </AuthProvider>
          </PurchasesProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
