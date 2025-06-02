import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Slot } from 'expo-router';
import { StatusBar, AppState } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ThemeProvider } from '@react-navigation/native';
import { TabBarProvider } from 'context/TabBarContext';
import { AppThemeProvider } from 'context/AppThemeContext';
import { useEffect, useState, useRef } from 'react';

// Import AdManager at the top
import AdManager from 'utils/ads/AdManager';

// Create a global reference to help with error recovery
global.AdManager = AdManager;

// Theme imports
import customDarkTheme, {
  COLORS,
  customLightTheme,
  LIGHT_COLORS,
} from 'styles/theme';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

// Components
import LoadingScreen from 'components/loading/LoadingScreen';
import OfflineBanner from '../components/offline/OfflineBanner';
import FlashMessage from 'react-native-flash-message';
import ErrorBoundary from '../components/error/ErrorBoundary';

// Custom hooks
import { useThemeManager } from 'hooks/useThemeManager';
import { useAdManager } from 'hooks/useAdManager';
import { useNetworkStatus } from 'hooks/useNetworkStatus';
import { useAuthNavigation } from 'hooks/useAuthNavigation';
import { useNotifications } from 'hooks/useNotifications';
import { useCacheManager } from 'hooks/useCacheManager'; // Add this import
import useUserStore from 'stores/userStore';

export default function Layout() {
  const [isLayoutMounted, setIsLayoutMounted] = useState(false);
  const appState = useRef(AppState.currentState);
  const isPremium = useUserStore((state) => state?.user?.isPro);

  // Add the cache manager hook
  useCacheManager();

  // Use custom hooks to manage different concerns
  const { isDarkMode, themeVersion } = useThemeManager(); // Get themeVersion
  const { isOnline } = useNetworkStatus();
  const {
    user,
    authLoading,
    isStoresHydrated,
    isInitialRouteSet,
    setIsInitialRouteSet,
    router,
  } = useAuthNavigation(isLayoutMounted);
  const { notificationData } = useNotifications(
    isLayoutMounted,
    isInitialRouteSet
  );
  const { initializeMobileAds } = useAdManager(isPremium);

  // Set layout mounted flag
  useEffect(() => {
    setIsLayoutMounted(true);
  }, []);

  // Initialize ads only after layout is mounted AND user store is hydrated
  // Make sure this useEffect doesn't run multiple times
  useEffect(() => {
    if (isLayoutMounted && isStoresHydrated) {
      const isLoggedIn = !!user?.uid;
      const shouldShowAds = isLoggedIn && !isPremium;

      console.log(
        `🔧 Setting up ads: logged in: ${isLoggedIn}, premium: ${isPremium}, should show ads: ${shouldShowAds}`
      );

      if (shouldShowAds) {
        // Only initialize once
        if (!AdManager.initialized) {
          initializeMobileAds();
          AdManager.setAuthState(true);
        }
      } else {
        AdManager.setAuthState(false);
      }
    }
  }, [
    isLayoutMounted,
    isStoresHydrated,
    user?.uid,
    isPremium,
    initializeMobileAds,
  ]);

  // Set initial route based on auth status
  useEffect(() => {
    if (
      !isStoresHydrated ||
      authLoading ||
      isInitialRouteSet ||
      !isLayoutMounted
    )
      return;

    const isAuthenticated = useUserStore.getState().isAuthenticated();
    const wasAuthenticated = useUserStore.getState().wasAuthenticated();

    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    } else if (!isOnline && wasAuthenticated) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/auth/entry');
    }
    setIsInitialRouteSet(true);
  }, [
    isStoresHydrated,
    authLoading,
    isOnline,
    isInitialRouteSet,
    isLayoutMounted,
  ]);

  // Prepare theme objects
  const paperTheme = isDarkMode ? customDarkTheme : customLightTheme;
  const navigationTheme = isDarkMode ? DarkTheme : DefaultTheme;
  const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';
  const { COLORS: ThemeColors } = isDarkMode
    ? { COLORS }
    : { COLORS: LIGHT_COLORS };

  // Stripe publishable keys - use different keys for development and production
  const stripePublishableKey = __DEV__
    ? 'pk_test_51RRhnICuI7euS6mCOyL8qUOd9I2BodVS1niHmfoGgTCv3F8hqktOOj0BP4LdTjRESW4Aj3VjVwjqj7wZn3m1U7gu00BxVrkPqX' // Development key
    : 'pk_live_51RRhnCEHUIrG8o0XwW0IfkILfQh2B5jC7dosJtEeUrrfXRno1tXOs4LSjDHxNMLdcubBi9SnV57SGsUKgFrF8NW500WwPN1cJT'; // Production key

  return (
    <ErrorBoundary>
      <TabBarProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StripeProvider publishableKey={stripePublishableKey}>
            <AppThemeProvider>
              <OfflineBanner visible={!isOnline} />
              <StatusBar
                backgroundColor={
                  isDarkMode ? COLORS.background : LIGHT_COLORS.background
                }
                barStyle={statusBarStyle}
              />
              {/* Add key={themeVersion} to force re-render on theme change */}
              <PaperProvider theme={paperTheme} key={`theme-${themeVersion}`}>
                <ThemeProvider value={navigationTheme}>
                  <Slot />
                  {(!isStoresHydrated || authLoading || !isInitialRouteSet) && (
                    <LoadingScreen message='Getting everything ready...' />
                  )}
                  <FlashMessage
                    position='top'
                    style={{
                      backgroundColor: ThemeColors.primary,
                      borderBottomColor: ThemeColors.onPrimary,
                    }}
                  />
                </ThemeProvider>
              </PaperProvider>
            </AppThemeProvider>
          </StripeProvider>
        </GestureHandlerRootView>
      </TabBarProvider>
    </ErrorBoundary>
  );
}

