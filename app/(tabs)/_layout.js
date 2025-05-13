import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { COLORS, LIGHT_COLORS } from 'styles/theme'; // Import LIGHT_COLORS too
import { MaterialIcons } from '@expo/vector-icons';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import useUserStore from 'stores/userStore';
import AnimatedTabBar from 'components/animatedtabbar/AnimatedTabBar';
import { useTabBar } from 'context/TabBarContext';
import { useMemo } from 'react'; // Add this import

export default function Layout() {
  const router = useRouter();
  const isGuest = useUserStore((state) => state.isGuest);
  const { visible } = useTabBar();

  // Add theme detection code
  const themePreference = useUserStore((state) => state.theme);
  const systemIsDark = useUserStore((state) => state.systemIsDark);

  // Calculate actual theme
  const isDarkMode = useMemo(() => {
    if (themePreference === 'system') {
      return systemIsDark !== false;
    }
    return themePreference === 'dark';
  }, [themePreference, systemIsDark]);

  // Get the right colors based on theme
  const colors = isDarkMode ? COLORS : LIGHT_COLORS;

  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} isDark={isDarkMode} />}
      // Add this prop to make React Navigation update theme
      colorScheme={isDarkMode ? 'dark' : 'light'}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background, // Use theme-aware background
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
              if (isGuest) {
                // Show snackbar if the user is a guest
                SnackbarService.show('You need to log in to post a quote.');
              } else {
                // Navigate to the post quote page
                router.push('/postquote');
              }
            }}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          height: 56,
          backgroundColor: 'transparent',
        },
        tabBarActiveTintColor: colors.primary, // Theme-aware active color
        tabBarInactiveTintColor: colors.placeholder, // Theme-aware inactive color
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
  );
}

