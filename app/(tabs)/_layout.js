import { useState } from 'react';
import { Menu, Button } from 'react-native-paper';
import { Tabs } from 'expo-router';
import { auth } from 'utils/firebase/firebaseconfig';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';

import { MaterialIcons } from '@expo/vector-icons';

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
      closeMenu();
      router.push('/entry');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.background, // Same dark color as body
            shadowColor: 'rgba(0, 0, 0, 0.25)', // Shadow color
            shadowOffset: { width: 0, height: 2 }, // Shadow offset
            shadowOpacity: 1, // Full opacity for shadow
            shadowRadius: 4, // Shadow blur radius
          },
          headerRight: () => (
            <Menu
              visible={visible}
              onDismiss={closeMenu}
              anchor={<Button icon='dots-vertical' onPress={openMenu} />}
            >
              <Menu.Item
                onPress={handleSignOut}
                title='Sign Out'
                disabled={isGuest}
              />
            </Menu>
          ),
          tabBarStyle: {
            backgroundColor: COLORS.background, // Tab bar background color
          },
          tabBarActiveTintColor: COLORS.primary, // Active tab color
          tabBarInactiveTintColor: COLORS.placeholder, // Inactive tab color
        }}
      >
        <Tabs.Screen
          name='home'
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialIcons
                name='home'
                color={focused ? COLORS.primary : COLORS.placeholder} // Primary color when focused
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name='browse'
          options={{
            title: 'Browse',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialIcons
                name='search'
                color={focused ? COLORS.primary : COLORS.placeholder} // Primary color when focused
                size={size}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

