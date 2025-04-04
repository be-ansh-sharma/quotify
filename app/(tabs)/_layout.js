import { useState } from "react";
import { Menu, Button } from "react-native-paper";
import { Tabs } from "expo-router";
import { useAuth } from "react-firebase-hooks/auth"; // Firebase hook to manage auth state
import { auth } from "utils/firebase/firebaseconfig";
import { useRouter } from "expo-router";
import useUserStore from "stores/userStore";
import customDarkTheme from "styles/theme";

export default function Layout() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const isGuest = useUserStore((state) => state.isGuest);

  // Menu visibility handlers
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  // Handle sign-out using Firebase hook
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      console.log("User signed out");
      closeMenu();
      router.push("/entry");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: customDarkTheme.colors.background, // Same dark color as body
            shadowColor: "rgba(0, 0, 0, 0.25)", // Shadow color
            shadowOffset: { width: 0, height: 2 }, // Shadow offset
            shadowOpacity: 1, // Full opacity for shadow
            shadowRadius: 4, // Shadow blur radius
          },
          headerRight: () => (
            <Menu
              visible={visible}
              onDismiss={closeMenu}
              anchor={<Button icon="dots-vertical" onPress={openMenu} />}
            >
              <Menu.Item
                onPress={handleSignOut}
                title="Sign Out"
                disabled={isGuest}
              />
            </Menu>
          ),
        }}
      >
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen name="browse" options={{ title: "Browse" }} />
      </Tabs>
    </>
  );
}
