import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import GestureHandlerRootView
import { PaperProvider } from 'react-native-paper';
import { Slot } from 'expo-router';
import customDarkTheme from 'styles/theme';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { SnackbarProvider } from 'components/snackbar/SnackbarProvider'; // adjust path as needed
import useUserStore from 'stores/userStore';
import { useEffect } from 'react';

export default function Layout() {
  const setHasCheckedProfileOnce = useUserStore(
    (state) => state.setHasCheckedProfileOnce
  );

  useEffect(() => {
    // Reset flag on cold start
    setHasCheckedProfileOnce(false);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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

