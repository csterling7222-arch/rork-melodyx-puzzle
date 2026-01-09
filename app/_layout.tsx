import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { initErrorTracking, addBreadcrumb, captureError } from '@/utils/errorTracking';
import { GameProvider } from '@/contexts/GameContext';
import { FeverProvider } from '@/contexts/FeverContext';
import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { DuelsProvider } from '@/contexts/DuelsContext';
import { EventsProvider } from '@/contexts/EventsContext';
import { EcoProvider } from '@/contexts/EcoContext';
import { PlaylistProvider } from '@/contexts/PlaylistContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PurchasesProvider } from '@/contexts/PurchasesContext';
import { InstrumentProvider } from '@/contexts/InstrumentContext';
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
  useEffect(() => {
    initErrorTracking();
    addBreadcrumb({ category: 'lifecycle', message: 'App launched', level: 'info' });
    console.log('[App] Error tracking initialized');
    
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
        addBreadcrumb({ category: 'lifecycle', message: 'Splash screen hidden', level: 'info' });
      } catch (error) {
        captureError(error, { tags: { component: 'RootLayout', action: 'hideSplash' } });
      }
    };
    
    hideSplash();
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
                              <StatusBar style="light" />
                              <RootLayoutNav />
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
