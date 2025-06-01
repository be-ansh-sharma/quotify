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
import {
  TextInput,
  Button,
  HelperText,
  Title,
  Text,
  List,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import {
  useCreateUserWithEmailAndPassword,
  useUpdateProfile,
} from 'react-firebase-hooks/auth';
import { auth } from 'utils/firebase/firebaseconfig';
import { createUser } from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { useAppTheme } from 'context/AppThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

// Import the utility
import { generateUniqueDisplayName } from 'utils/characterNames';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const [createUserWithEmailAndPassword, user, loading, error] =
    useCreateUserWithEmailAndPassword(auth);

  // Add updateProfile hook
  const [updateProfile, updating, updateError] = useUpdateProfile(auth);

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

  // Password validation
  const hasUpperCase = (str) => /[A-Z]/.test(str);
  const hasLowerCase = (str) => /[a-z]/.test(str);
  const hasNumber = (str) => /\d/.test(str);
  const hasMinLength = (str) => str.length >= 6;

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

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else {
      // Check password requirements
      const errors = [];
      if (!hasMinLength(password)) errors.push('At least 6 characters');
      if (!hasUpperCase(password)) errors.push('At least 1 uppercase letter');
      if (!hasLowerCase(password)) errors.push('At least 1 lowercase letter');
      if (!hasNumber(password)) errors.push('At least 1 number');

      if (errors.length > 0) {
        setPasswordError('Password must contain: ' + errors.join(', '));
        valid = false;
      }
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
      // Create the user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        email,
        password
      );

      if (!userCredential) return;

      // Generate a random display name for the user
      const displayName = generateUniqueDisplayName();

      // Update the auth profile with the display name
      const success = await updateProfile({ displayName });

      if (!success) {
        console.error('Failed to update profile:', updateError);
      }

      // Create the user document in Firestore
      await createUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName, // Add the randomly generated name
        createdAt: new Date(),
      });

      console.log(
        `User registered successfully with display name: ${displayName}`
      );
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // Handle update errors
  useEffect(() => {
    if (updateError) {
      console.error('Error updating profile:', updateError);
    }
  }, [updateError]);

  useEffect(() => {
    if (user) {
      setUser({ email: user.user.email });
      router.navigate('/(tabs)/home');
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setEmailError('Email already in use.');
          break;
        case 'auth/invalid-email':
          setEmailError('Invalid email address.');
          break;
        case 'auth/weak-password':
          setPasswordError(
            'Password is too weak. Please include uppercase, lowercase letters and numbers.'
          );
          break;
        case 'auth/missing-password':
          setPasswordError('Please enter a password.');
          break;
        case 'auth/admin-restricted-operation':
          setEmailError('Registration is temporarily disabled.');
          break;
        default:
          console.error('Unexpected error:', error.message);
          setPasswordError(error.message);
      }
    }
  }, [error]);

  // Check for both user creation and profile update loading states
  if (loading || updating) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant='bodyMedium'>
          {updating ? 'Setting up your profile...' : 'Creating account...'}
        </Text>
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
          secureTextEntry={!passwordVisible}
          error={!!passwordError}
          style={styles.input}
          theme={{ colors: { primary: COLORS.primary } }}
          right={
            <TextInput.Icon
              icon={passwordVisible ? 'eye-off' : 'eye'}
              onPress={() => setPasswordVisible(!passwordVisible)}
              color={COLORS.text}
            />
          }
        />
        {passwordError && <HelperText type='error'>{passwordError}</HelperText>}

        {/* Password requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password must contain:</Text>
          <View style={styles.requirement}>
            <MaterialIcons
              name={hasMinLength(password) ? 'check-circle' : 'circle'}
              size={16}
              color={hasMinLength(password) ? COLORS.primary : COLORS.text}
            />
            <Text
              style={[
                styles.requirementText,
                hasMinLength(password) && styles.requirementMet,
              ]}
            >
              At least 6 characters
            </Text>
          </View>
          <View style={styles.requirement}>
            <MaterialIcons
              name={hasUpperCase(password) ? 'check-circle' : 'circle'}
              size={16}
              color={hasUpperCase(password) ? COLORS.primary : COLORS.text}
            />
            <Text
              style={[
                styles.requirementText,
                hasUpperCase(password) && styles.requirementMet,
              ]}
            >
              At least 1 uppercase letter (A-Z)
            </Text>
          </View>
          <View style={styles.requirement}>
            <MaterialIcons
              name={hasLowerCase(password) ? 'check-circle' : 'circle'}
              size={16}
              color={hasLowerCase(password) ? COLORS.primary : COLORS.text}
            />
            <Text
              style={[
                styles.requirementText,
                hasLowerCase(password) && styles.requirementMet,
              ]}
            >
              At least 1 lowercase letter (a-z)
            </Text>
          </View>
          <View style={styles.requirement}>
            <MaterialIcons
              name={hasNumber(password) ? 'check-circle' : 'circle'}
              size={16}
              color={hasNumber(password) ? COLORS.primary : COLORS.text}
            />
            <Text
              style={[
                styles.requirementText,
                hasNumber(password) && styles.requirementMet,
              ]}
            >
              At least 1 number (0-9)
            </Text>
          </View>
        </View>

        <TextInput
          label='Confirm Password'
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!confirmPasswordVisible}
          error={!!confirmPasswordError}
          style={styles.input}
          theme={{ colors: { primary: COLORS.primary } }}
          right={
            <TextInput.Icon
              icon={confirmPasswordVisible ? 'eye-off' : 'eye'}
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
              color={COLORS.text}
            />
          }
        />
        {confirmPasswordError && (
          <HelperText type='error'>{confirmPasswordError}</HelperText>
        )}

        <Button
          mode='contained'
          onPress={handleRegister}
          style={styles.button}
          contentStyle={{ paddingVertical: 6 }}
          labelStyle={{ color: COLORS.onPrimary }}
        >
          Register
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
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

    // New styles for password requirements
    requirementsContainer: {
      marginTop: 8,
      marginBottom: 16,
      backgroundColor: COLORS.background,
      borderRadius: 4,
      padding: 12,
    },
    requirementsTitle: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
      color: COLORS.text,
    },
    requirement: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    requirementText: {
      fontSize: 13,
      marginLeft: 8,
      color: COLORS.text,
    },
    requirementMet: {
      color: COLORS.success,
    },
  });

