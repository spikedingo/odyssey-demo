import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { configureApiClient } from '@odyssey/api-client';
import { DensityProvider, ResponsiveProvider, ThemeProvider, ToastProvider } from '@odyssey/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

configureApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8787',
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnMount: true,
    },
  },
});

const interFontMap = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(interFontMap);

  // useFonts often never resolves on Expo Web; blocking here causes infinite spinner.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    void Font.loadAsync({
      Inter_400Regular: require('@expo-google-fonts/inter/Inter_400Regular.ttf'),
      Inter_500Medium: require('@expo-google-fonts/inter/Inter_500Medium.ttf'),
      Inter_600SemiBold: require('@expo-google-fonts/inter/Inter_600SemiBold.ttf'),
      Inter_700Bold: require('@expo-google-fonts/inter/Inter_700Bold.ttf'),
    }).catch((err) => console.warn('[fonts] Web font preload failed', err));
  }, []);

  const fontsReady = Platform.OS === 'web' || fontsLoaded || Boolean(fontError);

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ResponsiveProvider>
            <DensityProvider>
              <ToastProvider>
                <StatusBar style="auto" />
                <Stack screenOptions={{ headerShown: false }} />
              </ToastProvider>
            </DensityProvider>
          </ResponsiveProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
