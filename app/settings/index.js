import React from 'react';
import { View, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { List, Divider, Surface } from 'react-native-paper';
import Header from 'components/header/Header';
import useUserStore from 'stores/userStore';
import { auth } from 'utils/firebase/firebaseconfig';
import { COLORS } from 'styles/theme';

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
      <Header title='Settings' backRoute='/profile' />

      <View style={styles.container}>
        <Surface style={styles.card} elevation={2}>
          <List.Section>
            <List.Item
              title='Manage Notifications'
              titleStyle={styles.listItemTitle}
              left={(props) => (
                <List.Icon {...props} icon='bell' color={COLORS.primary} />
              )}
              onPress={() => router.push('/settings/notifications')}
              rippleColor={`${COLORS.primary}20`}
            />
            <Divider style={styles.divider} />
            <List.Item
              title='Privacy Policy'
              titleStyle={styles.listItemTitle}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon='shield-lock'
                  color={COLORS.primary}
                />
              )}
              onPress={() => router.push('/settings/privacy-policy')}
              rippleColor={`${COLORS.primary}20`}
            />
            <Divider style={styles.divider} />
            <List.Item
              title='Terms of Service'
              titleStyle={styles.listItemTitle}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon='file-document'
                  color={COLORS.primary}
                />
              )}
              onPress={() => router.push('/settings/terms-of-service')}
              rippleColor={`${COLORS.primary}20`}
            />
            <Divider style={styles.divider} />
            <List.Item
              title='Logout'
              titleStyle={styles.logoutText}
              left={(props) => (
                <List.Icon {...props} icon='logout' color={COLORS.error} />
              )}
              onPress={handleLogout}
              rippleColor={`${COLORS.error}20`}
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
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  divider: {
    backgroundColor: `${COLORS.disabled}40`,
  },
  listItemTitle: {
    color: COLORS.text,
    fontSize: 16,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
  },
});

