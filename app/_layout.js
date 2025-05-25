import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Slot, usePathname } from 'expo-router';
import { StatusBar, AppState, useColorScheme } from 'react-native';
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
import useUserStore from 'stores/userStore';

export default function Layout() {
  const currentPath = usePathname();
  const previousPathRef = useRef(currentPath);
  const [isLayoutMounted, setIsLayoutMounted] = useState(false);
  const appState = useRef(AppState.currentState);
  const isPremium = useUserStore((state) => state?.user?.isPro);

  // Use custom hooks to manage different concerns
  const { isDarkMode } = useThemeManager();
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
  const { initializeMobileAds, loadInterstitialAd, checkAndShowInterstitial } =
    useAdManager(isPremium);

  // Set layout mounted flag
  useEffect(() => {
    setIsLayoutMounted(true);
  }, []);

  // Initialize ads only after layout is mounted AND user store is hydrated
  useEffect(() => {
    if (isLayoutMounted && isStoresHydrated) {
      const isLoggedIn = !!user?.uid;

      if (isLoggedIn && !isPremium) {
        console.log('Initializing ads for logged in free user');
        initializeMobileAds();
        loadInterstitialAd();
      } else if (isLoggedIn && isPremium) {
        console.log('User is premium, not loading ads');
        AdManager.reset();
      } else {
        console.log('User not logged in, not loading ads');
        // Ensure ads are cleaned up if they were previously loaded
        AdManager.reset();
      }
    }
  }, [
    isLayoutMounted,
    isStoresHydrated,
    user?.uid,
    isPremium,
    initializeMobileAds,
    loadInterstitialAd,
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

  // Track navigation for interstitial ads
  useEffect(() => {
    checkAndShowInterstitial(currentPath, previousPathRef.current);
    previousPathRef.current = currentPath;
  }, [currentPath, checkAndShowInterstitial]);

  // Prepare theme objects
  const paperTheme = isDarkMode ? customDarkTheme : customLightTheme;
  const navigationTheme = isDarkMode ? DarkTheme : DefaultTheme;
  const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';
  const { COLORS: ThemeColors } = isDarkMode
    ? { COLORS }
    : { COLORS: LIGHT_COLORS };

  return (
    <ErrorBoundary>
      <TabBarProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StripeProvider publishableKey='pk_test_51RRhnICuI7euS6mCOyL8qUOd9I2BodVS1niHmfoGgTCv3F8hqktOOj0BP4LdTjRESW4Aj3VjVwjqj7wZn3m1U7gu00BxVrkPqX'>
            <AppThemeProvider>
              <OfflineBanner visible={!isOnline} />
              <StatusBar
                backgroundColor={
                  isDarkMode ? COLORS.background : LIGHT_COLORS.background
                }
                barStyle={statusBarStyle}
              />
              <PaperProvider theme={paperTheme}>
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

