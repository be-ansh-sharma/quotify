import React, { useState } from 'react';
import { View, Alert, StyleSheet, Text, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { List, Divider, Surface, ActivityIndicator } from 'react-native-paper';
import Header from 'components/header/Header';
import useUserStore from 'stores/userStore';
import { useAppTheme } from 'context/AppThemeContext';
import { logoutUser } from 'utils/helpers';
import { showSupportAd } from 'utils/ads/supportAds';

export default function Settings() {
  const router = useRouter();
  const theme = useUserStore((state) => state.theme);
  const user = useUserStore((state) => state.user);
  const [isLoadingAd, setIsLoadingAd] = useState(false);

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

  const handleContactSupport = async () => {
    const supportEmail = 'epoch.feedback@gmail.com';
    const subject = 'Quotify Support Request';
    const body = user?.uid ? `\n\n\nUser ID: ${user.uid}` : '';

    const url = `mailto:${supportEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Cannot Open Email',
        `Please email us directly at ${supportEmail}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSupportWithAd = () => {
    showSupportAd(
      () => setIsLoadingAd(true),
      (success) => setIsLoadingAd(false),
      () => {
        console.log('User supported app by watching ad');
      }
    );
  };

  return (
    <View style={styles.safeArea}>
      <Header title='Settings' backRoute='/profile' />

      <View style={styles.container}>
        <Surface style={styles.card} elevation={2}>
          <List.Section>
            <List.Item
              title='Theme'
              description='Choose light, dark, or system theme'
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

            {user?.uid && (
              <>
                <List.Item
                  title='Support with Ad'
                  description='Watch an ad to support us'
                  titleStyle={styles.listItemTitle}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon='heart'
                      color={COLORS.accent1 || '#E91E63'}
                    />
                  )}
                  onPress={handleSupportWithAd}
                  right={(props) =>
                    isLoadingAd && (
                      <ActivityIndicator size={20} color={COLORS.primary} />
                    )
                  }
                  disabled={isLoadingAd}
                  rippleColor={`${COLORS.accent1 || '#E91E63'}20`}
                />
                <Divider style={styles.divider} />
              </>
            )}

            <List.Item
              title='Manage Notifications'
              description='Control your notification preferences'
              titleStyle={styles.listItemTitle}
              left={(props) => (
                <List.Icon {...props} icon='bell' color={COLORS.primary} />
              )}
              onPress={() => router.push('/settings/notifications')}
              rippleColor={`${COLORS.primary}20`}
            />
            <Divider style={styles.divider} />
            <List.Item
              title='Contact Support'
              description='Email us for help or feedback'
              titleStyle={styles.listItemTitle}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon='email-outline'
                  color={COLORS.primary}
                />
              )}
              onPress={handleContactSupport}
              rippleColor={`${COLORS.primary}20`}
            />
            <Divider style={styles.divider} />
            <List.Item
              title='Privacy Policy'
              description='Read our privacy policy'
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
              description='Read our terms of service'
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
                description='Sign out of your account'
                titleStyle={styles.logoutText}
                left={(props) => (
                  <List.Icon {...props} icon='logout' color={COLORS.error} />
                )}
                onPress={handleLogout}
                rippleColor={`${COLORS.error}20`}
              />
            ) : (
              <List.Item
                title='Login'
                description='Sign in to your account'
                titleStyle={styles.listItemTitle}
                left={(props) => (
                  <List.Icon {...props} icon='key' color={COLORS.primary} />
                )}
                onPress={() => router.push('/auth/entry')}
                rippleColor={`${COLORS.primary}20`}
              />
            )}
          </List.Section>
        </Surface>

        {/* Made with love footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Made with <Text style={styles.heartEmoji}>❤️</Text> by{' '}
            <Text style={styles.companyName}>Soulpatcher</Text>
          </Text>
        </View>
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
    footerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
      paddingHorizontal: 16,
      marginTop: 16,
    },
    footerText: {
      fontSize: 14,
      color: COLORS.secondaryText,
      textAlign: 'center',
      lineHeight: 20,
    },
    heartEmoji: {
      fontSize: 16,
      color: '#E91E63', // Pink heart color
    },
    companyName: {
      fontSize: 14,
      color: COLORS.primary,
      fontWeight: '600',
      letterSpacing: 0.5,
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

