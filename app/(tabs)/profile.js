import React from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { List, Divider, Surface } from 'react-native-paper';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

import useUserStore from 'stores/userStore';
import { useAppTheme } from 'context/AppThemeContext';
import { logoutUser } from 'utils/helpers';

const ADMIN = 'anshsharma60@gmail.com';

export default function Profile() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  // Function to determine what name to display
  const getDisplayName = () => {
    // Second priority: displayName from Firebase Auth (stored in userStore)
    if (user?.displayName) {
      return user.displayName;
    }

    // Third priority: email (without domain)
    if (user?.email) {
      return user.email.split('@')[0];
    }

    // Fallback
    return 'Anonymous';
  };

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
    <View style={styles.container}>
      <View style={styles.editContainer}>
        <TouchableOpacity
          onPress={() => router.push('/profile/edit')}
          style={styles.editButton}
          disabled={!user?.uid}
        >
          <FontAwesome name='edit' size={18} color={COLORS.primary} />
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <Surface style={styles.userCard} elevation={2}>
        <List.Icon icon='account' color={COLORS.primary} size={48} />
        <View style={styles.userDetails}>
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>{getDisplayName()}</Text>

            {/* Pro Badge - Only shown for Pro users */}
            {user?.isPro && (
              <View style={styles.proBadgeContainer}>
                <FontAwesome5 name='crown' size={16} color='#FFD700' />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmail}>{user?.email || 'Not logged in'}</Text>
        </View>
      </Surface>

      <List.Section style={styles.linksSection}>
        <List.Item
          title='Bookmarked Quotes'
          left={(props) => (
            <List.Icon
              {...props}
              icon='bookmark-outline'
              color={COLORS.primary}
            />
          )}
          onPress={() => router.push('/profile/bookmarked')}
        />
        <Divider />
        <List.Item
          title='Liked Quotes'
          left={(props) => (
            <List.Icon {...props} icon='heart' color={COLORS.primary} />
          )}
          onPress={() => router.push('/profile/liked')}
        />
        <Divider />
        <List.Item
          title='Favorite Authors'
          left={(props) => (
            <List.Icon {...props} icon='account-heart' color={COLORS.primary} />
          )}
          onPress={() => router.push('/profile/authors')}
        />
        <Divider />
        <List.Item
          title='My Quotes'
          left={(props) => (
            <List.Icon
              {...props}
              icon='format-quote-open'
              color={COLORS.primary}
            />
          )}
          onPress={() => router.push('/profile/myquotes')}
        />
        <Divider />
        {user?.email === ADMIN && (
          <>
            <List.Item
              title='Pending Quotes'
              left={(props) => (
                <List.Icon
                  {...props}
                  icon='format-quote-open'
                  color={COLORS.primary}
                />
              )}
              onPress={() => router.push('/profile/pendingquotes')}
            />
            <Divider />
          </>
        )}
        {!user?.isPro && (
          <>
            <List.Item
              title='Go Pro'
              left={(props) => (
                <List.Icon {...props} icon='star' color={COLORS.primary} />
              )}
              onPress={() => router.push('/profile/pro/')}
            />
            <Divider />
          </>
        )}
        <List.Item
          title='Settings'
          left={(props) => (
            <List.Icon {...props} icon='cog' color={COLORS.primary} />
          )}
          onPress={() => router.push('/settings')}
        />
        <Divider />
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
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      padding: 16,
    },
    editContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 8,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: COLORS.surface,
    },
    editText: {
      fontSize: 14,
      color: COLORS.primary,
      marginLeft: 6,
      fontWeight: '600',
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    userDetails: {
      marginLeft: 12,
    },
    nameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    userName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.text,
    },
    userEmail: {
      fontSize: 14,
      color: COLORS.placeholder,
      marginTop: 2,
    },
    proBadgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primary,
      borderRadius: 16, // Slightly larger radius
      paddingVertical: 4, // More vertical padding
      paddingHorizontal: 8, // More horizontal padding
      marginLeft: 12, // Slightly more margin from name
      borderWidth: 1,
      borderColor: COLORS.primary,
    },
    proBadgeText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: COLORS.onPrimary, // Use onPrimary color for better contrast
      marginLeft: 4,
    },
    linksSection: {
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      paddingVertical: 4,
      elevation: 2,
    },
    logoutText: {
      color: COLORS.error,
      fontWeight: '600',
    },
    // Add new style for the generated name indicator
    generatedNameBadge: {
      backgroundColor: 'rgba(0,0,0,0.05)',
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
      marginTop: 4,
    },
    generatedNameText: {
      fontSize: 10,
      color: COLORS.textSecondary || COLORS.placeholder,
      fontStyle: 'italic',
    },
  });

