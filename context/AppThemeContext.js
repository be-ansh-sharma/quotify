import React, { createContext, useContext } from 'react';
import { COLORS as BaseColors, LIGHT_COLORS } from 'styles/theme';
import useUserStore from 'stores/userStore';
import { useMemo } from 'react';

// Create theme context
const AppThemeContext = createContext({
  COLORS: BaseColors,
  isDark: true,
});

export const AppThemeProvider = ({ children }) => {
  // Get theme preference from store
  const themePreference = useUserStore((state) => state.theme);
  const systemIsDark = useUserStore((state) => state.systemIsDark);

  // Calculate if we're in dark mode
  const isDark = useMemo(() => {
    if (themePreference === 'system') return systemIsDark !== false;
    return themePreference === 'dark';
  }, [themePreference, systemIsDark]);

  // Get the right theme object - keep the name COLORS for familiarity
  const COLORS = isDark ? BaseColors : LIGHT_COLORS;

  return (
    <AppThemeContext.Provider value={{ COLORS, isDark }}>
      {children}
    </AppThemeContext.Provider>
  );
};

// Hook to use theme in components
export const useAppTheme = () => useContext(AppThemeContext);

