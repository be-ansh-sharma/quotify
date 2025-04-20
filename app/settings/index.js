import React from 'react';
import { View, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { List, Divider, Surface } from 'react-native-paper';

import useUserStore from 'stores/userStore';
import { auth } from 'utils/firebase/firebaseconfig';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons';

export default function Settings() {
  const router = useRouter();
  const resetUser = useUserStore((state) => state.resetUser);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await auth.signOut();
            resetUser();
            router.replace('/auth/entry');
          } catch (error) {
            console.error('Error logging out:', error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.safeArea}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile')} // Navigate back to the profile screen
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Main Content */}
      <View style={styles.container}>
        <Surface style={styles.card} elevation={2}>
          <List.Section>
            <List.Item
              title='Manage Notifications'
              left={(props) => (
                <List.Icon {...props} icon='bell' color={COLORS.icon} />
              )}
              onPress={() => router.push('/settings/notifications')}
            />
            <Divider />
            <List.Item
              title='Privacy Policy'
              left={(props) => (
                <List.Icon {...props} icon='shield-lock' color={COLORS.icon} />
              )}
              onPress={() => router.push('/settings/privacy-policy')}
            />
            <Divider />
            <List.Item
              title='Terms of Service'
              left={(props) => (
                <List.Icon
                  {...props}
                  icon='file-document'
                  color={COLORS.icon}
                />
              )}
              onPress={() => router.push('/settings/terms-of-service')}
            />
            <Divider />
            <List.Item
              title='Logout'
              left={(props) => (
                <List.Icon {...props} icon='logout' color={COLORS.error} />
              )}
              onPress={handleLogout}
            />
          </List.Section>
        </Surface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});

