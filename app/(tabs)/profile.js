import React from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { List, Divider, Surface } from 'react-native-paper';
import { FontAwesome } from '@expo/vector-icons';

import useUserStore from 'stores/userStore';
import { auth } from 'utils/firebase/firebaseconfig';
import { useAppTheme } from 'context/AppThemeContext';

const ADMIN = 'us@yopmail.com';

export default function Profile() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const resetUser = useUserStore((state) => state.resetUser);
  const isGuest = useUserStore((state) => state.isGuest);

  const { COLORS } = useAppTheme();

  const styles = getStyles(COLORS);

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
    <View style={styles.container}>
      <View style={styles.editContainer}>
        {isGuest ? (
          <TouchableOpacity
            onPress={() => router.push('/auth/entry')}
            style={styles.editButton}
          >
            <FontAwesome name='sign-in' size={18} color={COLORS.primary} />
            <Text style={styles.editText}>Log In</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/profile/edit')}
            style={styles.editButton}
          >
            <FontAwesome name='edit' size={18} color={COLORS.primary} />
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <Surface style={styles.userCard} elevation={2}>
        <List.Icon icon='account' color={COLORS.primary} size={48} />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {user?.firstName
              ? `${user?.firstName} ${user?.lastName}`
              : `Anonymous`}
          </Text>
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
            <List.Icon {...props} icon='heart' color={COLORS.primary} /> // Red for heart
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

        <List.Item
          title='Settings'
          left={(props) => (
            <List.Icon {...props} icon='cog' color={COLORS.primary} />
          )}
          onPress={() => router.push('/settings')}
        />
        <Divider />
        {isGuest ? (
          <List.Item
            title='Login'
            left={(props) => (
              <List.Icon {...props} icon='key' color={COLORS.primary} />
            )}
            onPress={() => router.push('/auth/entry')}
          />
        ) : (
          <List.Item
            title='Logout'
            left={(props) => (
              <List.Icon {...props} icon='logout' color={COLORS.error} />
            )}
            onPress={handleLogout}
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
  });

