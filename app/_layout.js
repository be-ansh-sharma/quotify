import * as NavigationBar from 'expo-navigation-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Slot, useRouter } from 'expo-router';
import customDarkTheme, {
  COLORS,
  customLightTheme,
  LIGHT_COLORS,
} from 'styles/theme';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { SnackbarProvider } from 'components/snackbar/SnackbarProvider';
import useUserStore from 'stores/userStore';
import { useEffect, useState, useRef, useMemo } from 'react';
import { StatusBar, AppState, useColorScheme } from 'react-native';
import * as Notifications from 'expo-notifications';
import { TabBarProvider } from 'context/TabBarContext';
import { clearAllQuotesCache } from 'utils/quotesCache';
import LoadingScreen from 'components/loading/LoadingScreen';
import { auth } from 'utils/firebase/firebaseconfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { setAppTheme } from 'styles/theme';
import { AppThemeProvider } from 'context/AppThemeContext';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OfflineBanner from '../components/offline/OfflineBanner';
import { handleAuthentication } from 'utils/services/authServices';
import {
  setupNotificationHandlers,
  getInitialNotification,
} from 'utils/services/notificationService';

// In your Layout component
export default function Layout() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const isStoresHydrated = useUserStore((state) => state.hydrated);
  const setUser = useUserStore((state) => state.setUser);
  const setHasCheckedProfileOnce = useUserStore(
    (state) => state.setHasCheckedProfileOnce
  );

  const [isInitialRouteSet, setIsInitialRouteSet] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const [isLayoutMounted, setIsLayoutMounted] = useState(false);
  const appState = useRef(AppState.currentState);

  // Get theme information from store - place all theme logic together
  const themePreference = useUserStore((state) => state.theme);
  const systemIsDark = useUserStore((state) => state.systemIsDark);
  const colorScheme = useColorScheme();
  const setSystemTheme = useUserStore((state) => state.setSystemTheme);

  // New state variables for network status
  const [isOnline, setIsOnline] = useState(true);
  const [offlinePreviouslyLoggedIn, setOfflinePreviouslyLoggedIn] =
    useState(false);

  // Set system theme detection immediately
  useEffect(() => {
    setSystemTheme(colorScheme === 'dark');
  }, [colorScheme, setSystemTheme]);

  // Update all dynamic styles in profile.js
  const isDarkMode = useMemo(() => {
    if (themePreference === 'system') {
      return systemIsDark !== false;
    }
    return themePreference === 'dark';
  }, [themePreference, systemIsDark]);

  setAppTheme(isDarkMode ? 'dark' : 'light');

  // ALSO update when theme changes
  useEffect(() => {
    setAppTheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Derive all theme objects from the single source of truth
  const paperTheme = isDarkMode ? customDarkTheme : customLightTheme;
  const navigationTheme = isDarkMode ? DarkTheme : DefaultTheme;
  const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

  // Track when layout is mounted
  useEffect(() => {
    setIsLayoutMounted(true);
  }, []);

  // Update navigation bar
  useEffect(() => {
    const updateNavBar = async () => {
      // Replace themeColors with the correct variable - isDarkMode determines which colors to use
      const bgColor = isDarkMode ? COLORS.background : LIGHT_COLORS.background;
      await NavigationBar.setBackgroundColorAsync(bgColor);
      await NavigationBar.setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
    };
    updateNavBar();
  }, [isDarkMode]);

  // Notification and auth-related listeners
  useEffect(() => {
    if (!isStoresHydrated || !isLayoutMounted) return;

    setHasCheckedProfileOnce(false);

    // Set up notification handlers
    const { foregroundSubscription, responseSubscription } =
      setupNotificationHandlers();

    // Handle notifications
    (async () => {
      const initialNotificationData = await getInitialNotification();
      if (initialNotificationData) setNotificationData(initialNotificationData);
    })();

    // Handle auth state - only for authenticated users now
    if (user?.uid) {
      handleAuthentication(user, router).catch((err) => {
        console.error('Error in authentication:', err);
      });
    }

    // Cleanup
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [isStoresHydrated, isLayoutMounted, user?.uid]);

  // Cache management
  useEffect(() => {
    clearAllQuotesCache();
    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        await clearAllQuotesCache();
      }
      appState.current = nextAppState;
    };
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription.remove();
  }, []);

  // Network monitoring effect
  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });

    // Check for persisted auth on mount
    const checkPersistedAuth = async () => {
      try {
        const persistedAuth = await AsyncStorage.getItem('persistedAuthUser');
        if (persistedAuth) {
          setOfflinePreviouslyLoggedIn(true);
        }
      } catch (e) {
        console.error('Error reading persisted auth:', e);
      }
    };

    checkPersistedAuth();

    return () => {
      unsubscribeNetInfo();
    };
  }, []);

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
      // User is logged in
      router.replace('/(tabs)/home');
    } else if (!isOnline && wasAuthenticated) {
      // Offline but previously logged in
      router.replace('/(tabs)/home');
    } else {
      // Not logged in - force to auth entry
      router.replace('/auth/entry');
    }
    setIsInitialRouteSet(true);
  }, [
    isStoresHydrated,
    authLoading,
    isOnline,
    router,
    isInitialRouteSet,
    isLayoutMounted,
  ]);

  useEffect(() => {
    if (notificationData?.quoteId && isLayoutMounted && isInitialRouteSet) {
      router.navigate('/(tabs)/home');
      setNotificationData(null);
    }
  }, [notificationData, isLayoutMounted, isInitialRouteSet, router]);

  return (
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
                <SnackbarProvider>
                  <Slot />
                  {(!isStoresHydrated || authLoading || !isInitialRouteSet) && (
                    <LoadingScreen message='Getting everything ready...' />
                  )}
                </SnackbarProvider>
              </ThemeProvider>
            </PaperProvider>
          </AppThemeProvider>
        </StripeProvider>
      </GestureHandlerRootView>
    </TabBarProvider>
  );
}

