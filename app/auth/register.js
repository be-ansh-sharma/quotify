import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, HelperText, Title, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from 'utils/firebase/firebaseconfig';
import { createUser } from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);

  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const [createUserWithEmailAndPassword, user, loading, error] =
    useCreateUserWithEmailAndPassword(auth);

  // Start animation when component mounts
  useEffect(() => {
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
    ]).start();
  }, []);

  const validate = () => {
    let valid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      valid = false;
    }

    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords must match');
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        email,
        password
      );
      if (!userCredential) return;

      await createUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      });
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setEmailError('Email already in use.');
          break;
        case 'auth/invalid-email':
          setEmailError('Invalid email address.');
          break;
        case 'auth/weak-password':
          setPasswordError('Password too weak.');
          break;
        default:
          console.error('Unexpected error:', err.message);
      }
    }
  };

  useEffect(() => {
    if (user) {
      setUser({ email: user.user.email });
      router.navigate('/(tabs)/home');
    }
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant='bodyMedium'>Creating account...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name='arrow-back' size={24} color={COLORS.primary} />
      </TouchableOpacity>

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

      <View style={styles.formContainer}>
        <Title style={styles.title}>Create Account</Title>

        <TextInput
          label='Email'
          value={email}
          onChangeText={setEmail}
          keyboardType='email-address'
          autoCapitalize='none'
          error={!!emailError}
          style={styles.input}
          theme={{ colors: { primary: COLORS.primary } }}
        />
        {emailError && <HelperText type='error'>{emailError}</HelperText>}

        <TextInput
          label='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={!!passwordError}
          style={styles.input}
          theme={{ colors: { primary: COLORS.primary } }}
        />
        {passwordError && <HelperText type='error'>{passwordError}</HelperText>}

        <TextInput
          label='Confirm Password'
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={!!confirmPasswordError}
          style={styles.input}
          theme={{ colors: { primary: COLORS.primary } }}
        />
        {confirmPasswordError && (
          <HelperText type='error'>{confirmPasswordError}</HelperText>
        )}

        <Button
          mode='contained'
          onPress={handleRegister}
          style={styles.button}
          contentStyle={{ paddingVertical: 6 }}
          labelStyle={{ color: COLORS.icon }}
          color={COLORS.primary}
        >
          Register
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  // Logo styles
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  // Form styles
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: COLORS.text,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  // Add new back button style
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
});

