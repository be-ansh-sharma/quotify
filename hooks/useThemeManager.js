import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import useUserStore from 'stores/userStore';
import { COLORS, LIGHT_COLORS, setAppTheme } from 'styles/theme';

export function useThemeManager() {
  const themePreference = useUserStore((state) => state.theme);
  const systemIsDark = useUserStore((state) => state.systemIsDark);
  const colorScheme = useColorScheme();
  const setSystemTheme = useUserStore((state) => state.setSystemTheme);

  // Set system theme detection immediately
  useEffect(() => {
    setSystemTheme(colorScheme === 'dark');
  }, [colorScheme, setSystemTheme]);

  // Calculate dark mode status
  const isDarkMode = useMemo(() => {
    if (themePreference === 'system') {
      return systemIsDark !== false;
    }
    return themePreference === 'dark';
  }, [themePreference, systemIsDark]);

  // Apply theme on change
  useEffect(() => {
    setAppTheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Update navigation bar
  useEffect(() => {
    const updateNavBar = async () => {
      const bgColor = isDarkMode ? COLORS.background : LIGHT_COLORS.background;
      await NavigationBar.setBackgroundColorAsync(bgColor);
      await NavigationBar.setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
    };
    updateNavBar();
  }, [isDarkMode]);

  return { isDarkMode };
}

