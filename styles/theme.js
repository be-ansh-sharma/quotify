import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// Define dark and light color palettes
const DARK_COLORS_VALUES = {
  primary: '#0099ff',
  accent: '#FF6F61',
  background: '#121212',
  surface: '#1A1A1A',
  text: '#E1E1E1',
  secondaryText: '#B3B3B3',
  placeholder: '#B3B3B3',
  notification: '#FF6F61',
  disabled: '#505050',
  onSurface: '#FFFFFF',
  onBackground: '#E1E1E1',
  shadow: '#000000',
  tag: '#1DA1F2',
  avatarText: '#FFFFFF',
  icon: '#E5E5E5',
  liked: '#E0245E',
  error: '#B00020',
  border: '#2A2A2A',
  card: '#1E1E1E',
};

const LIGHT_COLORS_VALUES = {
  primary: '#0096DA',
  accent: '#FF6F61',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  onPrimary: '#FFFFFF',
  text: '#212121',
  secondaryText: '#757575',
  placeholder: '#9E9E9E',
  notification: '#FF6F61',
  disabled: '#DEDEDE',
  onSurface: '#000000',
  onBackground: '#212121',
  shadow: '#CCCCCC',
  tag: '#0096DA',
  avatarText: '#FFFFFF',
  icon: '#424242',
  liked: '#E0245E',
  error: '#B00020',
  border: '#E0E0E0',
  card: '#FFFFFF',
};

// Store current theme name and values separately for debugging
let _currentTheme = 'dark'; // Default
let _currentColorValues = { ...DARK_COLORS_VALUES };

// Create the COLORS object with getter functions
export const COLORS = {
  // Basic colors
  get primary() {
    return _currentColorValues.primary;
  },
  get accent() {
    return _currentColorValues.accent;
  },
  get background() {
    return _currentColorValues.background;
  },
  get surface() {
    return _currentColorValues.surface;
  },
  get text() {
    return _currentColorValues.text;
  },
  get secondaryText() {
    return _currentColorValues.secondaryText;
  },
  get placeholder() {
    return _currentColorValues.placeholder;
  },
  get notification() {
    return _currentColorValues.notification;
  },
  get disabled() {
    return _currentColorValues.disabled;
  },
  get onSurface() {
    return _currentColorValues.onSurface;
  },
  get onBackground() {
    return _currentColorValues.onBackground;
  },
  get shadow() {
    return _currentColorValues.shadow;
  },
  get tag() {
    return _currentColorValues.tag;
  },
  get avatarText() {
    return _currentColorValues.avatarText;
  },
  get icon() {
    return _currentColorValues.icon;
  },
  get liked() {
    return _currentColorValues.liked;
  },
  get error() {
    return _currentColorValues.error;
  },
  get border() {
    return _currentColorValues.border;
  },
  get card() {
    return _currentColorValues.card;
  },

  // Add debugging properties
  get _currentTheme() {
    return _currentTheme;
  },
  get _isDark() {
    return _currentTheme === 'dark';
  },
};

// Function to set the theme
export function setAppTheme(theme) {
  console.log(`[THEME] Setting theme to: ${theme}`);
  _currentTheme = theme;
  _currentColorValues =
    theme === 'light' ? LIGHT_COLORS_VALUES : DARK_COLORS_VALUES;

  // Log confirmation that theme was updated
  console.log(
    `[THEME] Theme updated - background: ${COLORS.background}, text: ${COLORS.text}`
  );
  return COLORS; // Return for chaining
}

// Create theme objects for React Native Paper
const customDarkTheme = {
  ...MD3DarkTheme,
  colors: { ...MD3DarkTheme.colors, ...DARK_COLORS_VALUES },
  roundness: 8,
  dark: true,
};

const customLightTheme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, ...LIGHT_COLORS_VALUES },
  roundness: 8,
  dark: false,
};

export {
  DARK_COLORS_VALUES as DARK_COLORS,
  LIGHT_COLORS_VALUES as LIGHT_COLORS,
  customLightTheme,
};
export default customDarkTheme;

