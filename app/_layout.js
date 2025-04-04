import { PaperProvider } from "react-native-paper";
import { Slot } from "expo-router";
import customDarkTheme from "styles/theme"; // Your custom dark theme for Paper
import { DarkTheme, ThemeProvider } from "@react-navigation/native"; // For navigation dark theme

export default function Layout() {
  return (
    <PaperProvider theme={customDarkTheme}>
      <ThemeProvider value={DarkTheme}>
        <Slot />
      </ThemeProvider>
    </PaperProvider>
  );
}
