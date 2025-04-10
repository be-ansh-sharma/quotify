import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore'; // Import user store for user-related actions
import { COLORS } from 'styles/theme';
import { auth } from 'utils/firebase/firebaseconfig'; // Firebase auth for logout
import { FontAwesome } from '@expo/vector-icons'; // For back button

export default function Settings() {
  const router = useRouter();
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
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.listContainer}>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/settings/notifications')}
        >
          <Text style={styles.settingText}>Manage Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/settings/privacy-policy')}
        >
          <Text style={styles.settingText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/settings/terms-of-service')}
        >
          <Text style={styles.settingText}>Terms of Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
      {/* Settings Options */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.primary, // Use the app's primary color for the header
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text, // Use a contrasting color for the text
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
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

