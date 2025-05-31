import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  setupNotificationHandlers,
  getInitialNotification,
} from 'utils/services/notificationService';
import { AppState } from 'react-native';
import useUserStore from 'stores/userStore';

export function useNotifications(isLayoutMounted, isInitialRouteSet) {
  const [notificationData, setNotificationData] = useState(null);
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const user = useUserStore((state) => state.user);

  // Set up notification handlers
  useEffect(() => {
    // Handle app state changes (foreground/background)
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextAppState) => {
        // When app comes to foreground from background
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // Check for pending notifications
          checkForPendingNotifications();
        }

        appState.current = nextAppState;
      }
    );

    // Main notification setup
    const { foregroundSubscription, responseSubscription } =
      setupNotificationHandlers();

    // Check for initial notification that launched the app
    const checkForPendingNotifications = async () => {
      const initialNotificationData = await getInitialNotification();
      if (initialNotificationData) {
        console.log('Found notification data:', initialNotificationData);
        setNotificationData(initialNotificationData);
      }
    };

    // Run initial check
    checkForPendingNotifications();

    // Clean up when component unmounts
    return () => {
      appStateSubscription.remove();

      if (
        foregroundSubscription &&
        typeof foregroundSubscription === 'function'
      ) {
        foregroundSubscription();
      }

      if (responseSubscription && typeof responseSubscription === 'function') {
        responseSubscription();
      }
    };
  }, [user?.uid]);

  // Handle navigation when notification contains a quoteId
  useEffect(() => {
    if (notificationData?.quoteId && isLayoutMounted && isInitialRouteSet) {
      // Add a slight delay to ensure navigation works properly
      const timer = setTimeout(() => {
        console.log('Navigating to quote:', notificationData.quoteId);
        router.navigate(`/quote/${notificationData.quoteId}`);
        setNotificationData(null);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [notificationData, isLayoutMounted, isInitialRouteSet, router]);

  // Handle navigation when notification is pressed
  useEffect(() => {
    if (notificationData?.pressed && isLayoutMounted && isInitialRouteSet) {
      // Navigate to home page instead of specific quote
      console.log('Navigating to home page from notification');

      // Delay navigation slightly to ensure app is ready
      const timer = setTimeout(() => {
        router.navigate('/(tabs)/home');
        setNotificationData(null);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [notificationData, isLayoutMounted, isInitialRouteSet, router]);

  return { notificationData };
}

