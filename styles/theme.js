import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

const COLORS = {
  primary: '#1E88E5', // Custom primary color
  accent: '#FFC107', // Custom accent color
  background: '#121212', // Dark background color
  surface: '#1A1A1A', // Dark surface color
  text: '#E1E1E1', // Light text color
  placeholder: '#B3B3B3', // Placeholder text color
  notification: '#FF6F61', // Notification color
  disabled: '#505050', // Disabled elements
  onSurface: '#FFFFFF', // Text on surface
  onBackground: '#E1E1E1', // Text on background
  shadow: '#000000', // Shadow color
  tag: '#1DA1F2', // Tag color
  avatarText: '#FFFFFF', // White text for initials
  icon: '#E5E5E5', // Icon color
  liked: '#E0245E', // Liked color
  error: '#B00020', // Error color
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...COLORS, // Merge custom colors
    background: COLORS.background, // Override background for dark theme
    surface: COLORS.surface, // Override surface for dark theme
  },
  roundness: 4,
  dark: true,
};

const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...COLORS, // Merge custom colors
    background: '#FFFFFF', // Override background for light theme
    surface: '#F5F5F5', // Override surface for light theme
    text: '#212121', // Override text color for light theme
  },
  roundness: 4,
  dark: false,
};

const useAppTheme = () => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? customDarkTheme : customLightTheme;
};

export { COLORS, customDarkTheme, customLightTheme, useAppTheme };

