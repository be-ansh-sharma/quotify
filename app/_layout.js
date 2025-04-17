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

