import { MD3DarkTheme } from 'react-native-paper';

const COLORS = {
  primary: '#00B0FF', // Twitter blue
  accent: '#FF6F61', // Accent color
  background: '#121212', // Body background color
  surface: '#1A1A1A', // Surface (like cards, modals, etc.)
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
  liked: '#E0245E',
  error: '#B00020',
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...COLORS, // Spread COLORS into the theme
  },
  roundness: 4,
  dark: true,
};

export { COLORS }; // Export COLORS separately
export default customDarkTheme;

