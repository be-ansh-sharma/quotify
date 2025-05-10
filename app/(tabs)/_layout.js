import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { COLORS } from 'styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import useUserStore from 'stores/userStore'; // Import user store

export default function Layout() {
  const router = useRouter();
  const isGuest = useUserStore((state) => state.isGuest); // Check if the user is a guest

  return (
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
          <MaterialIcons
            name='format-quote'
            size={28}
            color={COLORS.primary}
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
          backgroundColor: COLORS.background, // Tab bar background color
        },
        tabBarActiveTintColor: COLORS.primary, // Active tab color
        tabBarInactiveTintColor: COLORS.placeholder, // Inactive tab color
        tabBarPressColor: 'transparent', // <-- Remove ripple on Android
        tabBarPressOpacity: 1, // <-- Remove opacity change on iOS
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          title: 'Home',
          tabBarIcon: ({ size, focused }) => (
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
              color={focused ? COLORS.primary : COLORS.placeholder}
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
              color={focused ? COLORS.primary : COLORS.placeholder}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

