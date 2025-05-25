import { Tabs } from 'expo-router';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, LIGHT_COLORS } from 'styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import AnimatedTabBar from 'components/animatedtabbar/AnimatedTabBar';
import { useTabBar } from 'context/TabBarContext';
import { useMemo, useEffect, useRef } from 'react';
import useUserStore from 'stores/userStore';
import NavigationMiddleware from 'components/navigation/NavigationMiddleware';

export default function Layout() {
  const router = useRouter();

  const themePreference = useUserStore((state) => state.theme);
  const systemIsDark = useUserStore((state) => state.systemIsDark);

  const isDarkMode = useMemo(() => {
    if (themePreference === 'system') {
      return systemIsDark !== false;
    }
    return themePreference === 'dark';
  }, [themePreference, systemIsDark]);

  const colors = isDarkMode ? COLORS : LIGHT_COLORS;

  return (
    <NavigationMiddleware>
      <Tabs
        tabBar={(props) => <AnimatedTabBar {...props} isDark={isDarkMode} />}
        colorScheme={isDarkMode ? 'dark' : 'light'}
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
            shadowColor: isDarkMode
              ? 'rgba(0, 0, 0, 0.25)'
              : 'rgba(0, 0, 0, 0.1)',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 4,
          },
          headerRight: () => (
            <MaterialIcons
              name='format-quote'
              size={28}
              color={colors.primary}
              style={{ marginRight: 16 }}
              onPress={() => {
                router.push('/postquote');
              }}
            />
          ),
          tabBarStyle: {
            position: 'absolute',
            height: 56,
            backgroundColor: 'transparent',
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.placeholder,
          tabBarPressColor: 'transparent',
          tabBarPressOpacity: 1,
        }}
      >
        <Tabs.Screen
          name='home'
          options={{
            title: 'Home',
            tabBarIcon: ({ size, focused }) => (
              <MaterialIcons
                name='home'
                color={focused ? colors.primary : colors.placeholder}
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
                color={focused ? colors.primary : colors.placeholder}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name='profile'
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialIcons
                name='person'
                color={focused ? colors.primary : colors.placeholder}
                size={size}
              />
            ),
          }}
        />
      </Tabs>
    </NavigationMiddleware>
  );
}

