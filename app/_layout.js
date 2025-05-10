import * as NavigationBar from 'expo-navigation-bar';
import 'utils/firebase/firebaseconfig';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Slot } from 'expo-router';
import customDarkTheme, { COLORS } from 'styles/theme';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { SnackbarProvider } from 'components/snackbar/SnackbarProvider';
import useUserStore from 'stores/userStore';
import { useEffect } from 'react';
import { setupTokenRefreshListener } from 'utils/services/notifications/notifications';
import { StatusBar, useColorScheme } from 'react-native';
import * as Notifications from 'expo-notifications';
import { TabBarProvider } from 'context/TabBarContext';

export default function Layout() {
  const setHasCheckedProfileOnce = useUserStore(
    (state) => state.setHasCheckedProfileOnce
  );
  const user = useUserStore((state) => state.user);
  const isGuest = useUserStore((state) => state.isGuest);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const updateNavBar = async () => {
      await NavigationBar.setBackgroundColorAsync(
        COLORS.background || '#121212'
      );
      await NavigationBar.setButtonStyleAsync('light');
    };

    updateNavBar();
  }, [colorScheme]);

  useEffect(() => {
    setHasCheckedProfileOnce(false);

    if (isGuest) {
      console.log('Setting up token refresh listener for guest user...');
      setupTokenRefreshListener(null, true);
    } else if (user?.uid) {
      console.log('Setting up token refresh listener for logged-in user...');
      setupTokenRefreshListener(user.id, false);
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received in foreground:', notification);
      });

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response received:', response);

        const data = response.notification.request.content.data;
        if (data?.quoteId) {
          console.log('Navigating to quote:', data.quoteId);
        }
      });

    (async () => {
      const initialNotification =
        await Notifications.getLastNotificationResponseAsync();
      if (initialNotification) {
        console.log('App launched from notification:', initialNotification);

        const data = initialNotification.notification.request.content.data;
        if (data?.quoteId) {
          console.log('Navigating to quote from killed state:', data.quoteId);
        }
      }
    })();

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [isGuest, user?.uid]);

  return (
    <TabBarProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar
          backgroundColor={COLORS.background}
          barStyle='light-content'
        />
        <PaperProvider theme={customDarkTheme}>
          <ThemeProvider value={DarkTheme}>
            <SnackbarProvider>
              <Slot />
            </SnackbarProvider>
          </ThemeProvider>
        </PaperProvider>
      </GestureHandlerRootView>
    </TabBarProvider>
  );
}

