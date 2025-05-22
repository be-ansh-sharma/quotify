import React from 'react';
import { View, Alert, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { List, Divider, Surface } from 'react-native-paper';
import Header from 'components/header/Header';
import useUserStore from 'stores/userStore';
import { useAppTheme } from 'context/AppThemeContext';
import { logoutUser } from 'utils/helpers';

export default function Settings() {
  const router = useRouter();
  const resetUser = useUserStore((state) => state.resetUser);
  const theme = useUserStore((state) => state.theme);
  const user = useUserStore((state) => state.user);

  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logoutUser(router),
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
              title='Theme'
              titleStyle={styles.listItemTitle}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon='theme-light-dark'
                  color={COLORS.primary}
                />
              )}
              onPress={() => router.push('/settings/theme')}
              right={() => (
                <Text style={styles.themeValue}>
                  {theme === 'system'
                    ? 'System'
                    : theme === 'light'
                    ? 'Light'
                    : 'Dark'}
                </Text>
              )}
              rippleColor={`${COLORS.primary}20`}
            />
            <Divider style={styles.divider} />

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
            {user?.uid ? (
              <List.Item
                title='Logout'
                left={(props) => (
                  <List.Icon {...props} icon='logout' color={COLORS.error} />
                )}
                onPress={handleLogout}
              />
            ) : (
              <List.Item
                title='Login'
                left={(props) => (
                  <List.Icon {...props} icon='key' color={COLORS.primary} />
                )}
                onPress={() => router.push('/auth/entry')}
              />
            )}
          </List.Section>
        </Surface>
      </View>
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
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
    themeValue: {
      color: COLORS.secondaryText,
      fontSize: 14,
      marginRight: 8,
    },
  });

