import * as NavigationBar from 'expo-navigation-bar';
import 'utils/firebase/firebaseconfig';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Slot, useRouter, Stack } from 'expo-router';
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
import { setupTokenRefreshListener } from 'utils/services/notifications/notifications';
import { StatusBar, AppState, useColorScheme } from 'react-native';
import * as Notifications from 'expo-notifications';
import { TabBarProvider } from 'context/TabBarContext';
import { clearAllQuotesCache } from 'utils/quotesCache';
import LoadingScreen from 'components/loading/LoadingScreen';
import { auth } from 'utils/firebase/firebaseconfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  fetchUserProfile,
  storeFCMToken,
  fetchGuestFCMToken,
} from 'utils/firebase/firestore';
import { setAppTheme } from 'styles/theme';
import { AppThemeProvider } from 'context/AppThemeContext';

// Notification setup (no navigation here)
function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received in foreground:', notification);
    }
  );

  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response received:', response);
      return response.notification.request.content.data;
    });

  return { foregroundSubscription, responseSubscription };
}

// In your Layout component
export default function Layout() {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const isStoresHydrated = useUserStore((state) => state.hydrated);
  const isGuest = useUserStore((state) => state.isGuest);
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

  // Log on startup what theme should be used
  console.log(
    `[THEME INIT] Preference: ${themePreference}, System dark: ${systemIsDark}, Device scheme: ${colorScheme}`
  );

  // Set system theme detection immediately
  useEffect(() => {
    setSystemTheme(colorScheme === 'dark');
    console.log(`[THEME] System theme set to: ${colorScheme}`);
  }, [colorScheme, setSystemTheme]);

  // Update all dynamic styles in profile.js
  const isDarkMode = useMemo(() => {
    if (themePreference === 'system') {
      return systemIsDark !== false;
    }
    return themePreference === 'dark';
  }, [themePreference, systemIsDark]);

  // Set theme immediately and in effect
  // IMMEDIATELY on first render
  console.log(
    `[THEME] Setting initial theme to: ${isDarkMode ? 'dark' : 'light'}`
  );
  setAppTheme(isDarkMode ? 'dark' : 'light');

  // ALSO update when theme changes
  useEffect(() => {
    console.log(`[THEME] Theme changed to: ${isDarkMode ? 'dark' : 'light'}`);
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

    if (isGuest) {
      setupTokenRefreshListener(null, true);
      // Handle guest FCM token if needed
    } else if (user?.uid) {
      // 1. Setup token refresh listener
      setupTokenRefreshListener(user.uid, false);

      // 2. Fetch complete user profile instead of just setting auth data
      (async () => {
        try {
          console.log('Fetching user profile for user:', user.email);
          const userProfile = await fetchUserProfile(user.email);

          if (!userProfile) {
            console.log('User profile not found, redirecting to login...');
            await auth.signOut();
            router.push('/auth/entry');
            return;
          }

          console.log('User profile loaded in layout');
          setUser(userProfile);

          // 3. Handle FCM token after profile is loaded (moved from home.js)
          await fetchAndStoreFCMToken(userProfile);
        } catch (err) {
          console.error('Error fetching user profile in layout:', err);
        }
      })();
    }

    const { foregroundSubscription, responseSubscription } =
      setupNotifications();

    (async () => {
      try {
        const initialNotification =
          await Notifications.getLastNotificationResponseAsync();
        if (initialNotification?.notification?.request?.content?.data) {
          const data = initialNotification.notification.request.content.data;
          if (data?.quoteId) setNotificationData(data);
        }
      } catch (err) {
        console.error('Error checking initial notification:', err);
      }
    })();

    // Cleanup
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
    // Only re-run when these truly change:
  }, [isStoresHydrated, isLayoutMounted, isGuest, user?.uid]);

  // Add the FCM token handler function
  const fetchAndStoreFCMToken = async (currentUser) => {
    try {
      // Request notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          console.log('Notification permissions not granted');
          return;
        }
      }

      // Fetch the FCM token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '72429fcf-5b83-4cb5-b250-ffd6370f59bd',
      });
      const fcmToken = tokenData.data;

      // Check if token is already stored and matches
      if (currentUser?.fcmToken === fcmToken) {
        console.log('FCM token already up to date. Skipping update.');
        return;
      }

      if (isGuest) {
        // Guest FCM token handling
        const guestData = await fetchGuestFCMToken(fcmToken);

        if (guestData) {
          setUser({
            ...currentUser,
            fcmToken: guestData.fcmToken,
            preferences: guestData.preferences,
          });
        } else {
          let defaultPreferences = await storeFCMToken(null, fcmToken, true);
          setUser({
            ...currentUser,
            fcmToken,
            preferences: defaultPreferences,
          });
        }
      } else if (currentUser?.uid) {
        // Logged-in user FCM token handling
        let defaultPreferences = await storeFCMToken(
          currentUser.uid,
          fcmToken,
          false
        );

        setUser({
          ...currentUser,
          fcmToken,
          preferences: currentUser.preferences || defaultPreferences,
        });
      }
    } catch (error) {
      console.error('Error fetching or storing FCM token:', error);
    }
  };

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

  // Routing based on auth state
  useEffect(() => {
    if (
      !isStoresHydrated ||
      authLoading ||
      isInitialRouteSet ||
      !isLayoutMounted
    )
      return;

    if (user || isGuest) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/auth/entry');
    }
    setIsInitialRouteSet(true);
  }, [
    isStoresHydrated,
    authLoading,
    user,
    isGuest,
    router,
    isInitialRouteSet,
    isLayoutMounted,
  ]);

  // Notification navigation after layout and routes are set
  useEffect(() => {
    if (notificationData?.quoteId && isLayoutMounted && isInitialRouteSet) {
      router.push(`/quote/${notificationData.quoteId}`);
      setNotificationData(null);
    }
  }, [notificationData, isLayoutMounted, isInitialRouteSet, router]);

  // Always render Slot, overlay loading if needed
  return (
    <TabBarProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* Add AppThemeProvider at a high level in the tree */}
        <AppThemeProvider>
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
      </GestureHandlerRootView>
    </TabBarProvider>
  );
}

