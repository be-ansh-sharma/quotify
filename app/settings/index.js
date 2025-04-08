import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore'; // Import user store for user-related actions
import { COLORS } from 'styles/theme';
import { auth } from 'utils/firebase/firebaseconfig'; // Firebase auth for logout

export default function Settings() {
  const router = useRouter();
  const isDarkMode = useUserStore((state) => state.isDarkMode); // Get dark mode state
  const toggleDarkMode = useUserStore((state) => state.toggleDarkMode); // Function to toggle dark mode
  const resetUser = useUserStore((state) => state.resetUser); // Function to reset user state

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await auth.signOut(); // Sign out from Firebase
            resetUser(); // Reset user state in the store
            router.replace('/auth/entry'); // Navigate to the login/entry screen
          } catch (error) {
            console.error('Error logging out:', error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* Dark Mode Toggle */}
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Dark Mode</Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleDarkMode}
          thumbColor={isDarkMode ? COLORS.primary : COLORS.placeholder}
          trackColor={{
            false: COLORS.disabledBackground,
            true: COLORS.primary,
          }}
        />
      </View>

      {/* Notifications */}
      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => router.push('/settings/notifications')}
      >
        <Text style={styles.settingText}>Manage Notifications</Text>
      </TouchableOpacity>

      {/* Privacy Policy */}
      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => router.push('/settings/privacy-policy')}
      >
        <Text style={styles.settingText}>Privacy Policy</Text>
      </TouchableOpacity>

      {/* Terms of Service */}
      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => router.push('/settings/terms-of-service')}
      >
        <Text style={styles.settingText}>Terms of Service</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.settingItem, styles.logoutItem]}
        onPress={handleLogout}
      >
        <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  settingText: {
    fontSize: 16,
    color: COLORS.text,
  },
  logoutItem: {
    marginTop: 32,
  },
  logoutText: {
    color: COLORS.error,
  },
});

