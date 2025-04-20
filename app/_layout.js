import 'utils/firebase/firebaseconfig';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import GestureHandlerRootView
import { PaperProvider } from 'react-native-paper';
import { Slot } from 'expo-router';
import customDarkTheme, { COLORS } from 'styles/theme';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { SnackbarProvider } from 'components/snackbar/SnackbarProvider'; // adjust path as needed
import useUserStore from 'stores/userStore';
import { useEffect } from 'react';
import { setupTokenRefreshListener } from 'utils/services/notifications/notifications'; // Import the token refresh listener
import { StatusBar } from 'react-native'; // Import StatusBar
import * as Notifications from 'expo-notifications';

export default function Layout() {
  const setHasCheckedProfileOnce = useUserStore(
    (state) => state.setHasCheckedProfileOnce
  );
  const user = useUserStore((state) => state.user);
  const isGuest = useUserStore((state) => state.isGuest);

  useEffect(() => {
    // Reset flag on cold start
    setHasCheckedProfileOnce(false);

    // Set up the FCM token refresh listener
    if (isGuest) {
      console.log('Setting up token refresh listener for guest user...');
      setupTokenRefreshListener(null, true);
    } else if (user?.uid) {
      console.log('Setting up token refresh listener for logged-in user...');
      setupTokenRefreshListener(user.id, false);
    }

    // Set up notification handlers
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, // Show notification as an alert in the foreground
        shouldPlaySound: true, // Play a sound
        shouldSetBadge: false, // Do not update the app badge
      }),
    });

    // Listener for notifications received while the app is in the foreground
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received in foreground:', notification);
      });

    // Listener for notifications interacted with (e.g., tapped) by the user
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response received:', response);

        // Handle navigation or actions based on notification data
        const data = response.notification.request.content.data;
        if (data?.quoteId) {
          console.log('Navigating to quote:', data.quoteId);
          // Example: Navigate to a specific screen
          // router.push(`/quote/${data.quoteId}`);
        }
      });

    // Handle notifications when the app is killed
    (async () => {
      const initialNotification =
        await Notifications.getLastNotificationResponseAsync();
      if (initialNotification) {
        console.log('App launched from notification:', initialNotification);

        // Handle navigation or actions based on notification data
        const data = initialNotification.notification.request.content.data;
        if (data?.quoteId) {
          console.log('Navigating to quote from killed state:', data.quoteId);
          // Example: Navigate to a specific screen
          // router.push(`/quote/${data.quoteId}`);
        }
      }
    })();

    return () => {
      // Clean up listeners when the component unmounts
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [isGuest, user?.uid]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Set the status bar color */}
      <StatusBar backgroundColor={COLORS.background} barStyle='light-content' />
      <PaperProvider theme={customDarkTheme}>
        <ThemeProvider value={DarkTheme}>
          <SnackbarProvider>
            <Slot />
          </SnackbarProvider>
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

