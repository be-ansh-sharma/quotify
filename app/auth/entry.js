import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { Button, Title, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';
import { useAppTheme } from 'context/AppThemeContext'; // Import theme hook

export default function Entry() {
  const router = useRouter();

  const { COLORS } = useAppTheme(); // Get theme colors dynamically
  const styles = getStyles(COLORS); // Generate styles dynamically

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonsFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence the animations - logo first, then buttons
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Then fade in the buttons
      Animated.timing(buttonsFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated App Icon */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode='contain'
        />
        <Text style={styles.appName}>Quotify</Text>
      </Animated.View>

      <Title style={styles.title}>Discover & Share Inspiration</Title>
      <Text style={styles.subtitle}>Choose how you'd like to continue</Text>

      <Animated.View style={[styles.buttonGroup, { opacity: buttonsFadeAnim }]}>
        <Button
          mode='contained'
          onPress={() => router.navigate('/auth/login')}
          style={[styles.button, { backgroundColor: COLORS.primary }]}
          labelStyle={styles.onPrimary}
        >
          Login
        </Button>

        <Button
          mode='outlined'
          onPress={() => router.navigate('/auth/register')}
          style={styles.button}
          labelStyle={{ color: COLORS.primary }}
        >
          Register
        </Button>
      </Animated.View>
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: COLORS.background,
    },
    // Logo styles
    logoContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    logo: {
      width: 120,
      height: 120,
      borderRadius: 24,
      marginBottom: 12,
    },
    appName: {
      fontSize: 32,
      fontWeight: 'bold',
      color: COLORS.primary,
      letterSpacing: 1.5,
    },
    title: {
      fontSize: 22,
      textAlign: 'center',
      marginBottom: 8,
      color: COLORS.text,
    },
    subtitle: {
      textAlign: 'center',
      color: COLORS.placeholder,
      marginBottom: 32,
      fontSize: 16,
    },
    buttonGroup: {
      width: '100%',
      maxWidth: 300,
      gap: 16,
    },
    button: {
      borderRadius: 8,
      paddingVertical: 6,
    },
    buttonLabel: {
      color: COLORS.surface,
    },
  });

