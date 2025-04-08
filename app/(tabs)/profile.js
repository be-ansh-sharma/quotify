import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { List, Divider } from 'react-native-paper'; // Import List and Divider from React Native Paper
import useUserStore from 'stores/userStore'; // Import your user store
import { COLORS } from 'styles/theme';
import { auth } from 'utils/firebase/firebaseconfig'; // Import Firebase auth for logout

export default function Profile() {
  const router = useRouter();
  const user = useUserStore((state) => state.user); // Get user info from the store
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
      {/* User Info Section */}
      <View style={styles.userInfo}>
        <List.Icon icon='account' color={COLORS.primary} size={48} />
        <List.Item
          title={user?.name || 'Anonymous'}
          description={user?.email || 'Not logged in'}
          titleStyle={styles.userName}
          descriptionStyle={styles.userEmail}
        />
      </View>

      {/* Links Section */}
      <Divider />
      <List.Section>
        <List.Item
          title='Bookmarked Quotes'
          left={(props) => <List.Icon {...props} icon='bookmark' />}
          onPress={() => router.push('/profile/bookmarked')}
        />
        <Divider />
        <List.Item
          title='Liked Quotes'
          left={(props) => <List.Icon {...props} icon='heart' />}
          onPress={() => router.push('/profile/liked')}
        />
        <Divider />
        <List.Item
          title='Favorite Authors'
          left={(props) => <List.Icon {...props} icon='account-heart' />}
          onPress={() => router.push('/profile/authors')}
        />
        <Divider />
        <List.Item
          title='Settings'
          left={(props) => <List.Icon {...props} icon='cog' />}
          onPress={() => router.push('/settings')}
        />
        <Divider />
        <List.Item
          title='Logout'
          left={(props) => <List.Icon {...props} icon='logout' />}
          titleStyle={styles.logoutText}
          onPress={handleLogout}
        />
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.placeholder,
  },
  logoutText: {
    color: COLORS.error, // Highlight logout in a different color
  },
});
