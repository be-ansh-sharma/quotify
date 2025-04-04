import { MD3DarkTheme } from "react-native-paper";

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#1DA1F2",
    accent: "#FF6F61",
    background: "#121212", // Body background color
    surface: "#1A1A1A", // Surface (like cards, modals, etc.)
    text: "#E1E1E1",
    placeholder: "#B3B3B3",
    notification: "#FF6F61",
    disabled: "#505050",
    onSurface: "#FFFFFF",
    onBackground: "#E1E1E1",
  },
  roundness: 4,
  dark: true,
};

export default customDarkTheme;
