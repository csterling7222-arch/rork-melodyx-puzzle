import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from '@/contexts/GameContext';
import { FeverProvider } from '@/contexts/FeverContext';
import { UserProvider } from '@/contexts/UserContext';
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
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PurchasesProvider>
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
          </PurchasesProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
