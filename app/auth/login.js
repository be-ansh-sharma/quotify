import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  HelperText,
  Dialog,
  Portal,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from 'utils/firebase/firebaseconfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import useUserStore from 'stores/userStore';
import { useAppTheme } from 'context/AppThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

const Login = () => {
  const router = useRouter();
  const { COLORS } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(null);

  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);

  const setUser = useUserStore((state) => state.setUser);
  const setHasCheckedProfileOnce = useUserStore(
    (state) => state.setHasCheckedProfileOnce
  );

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (user) {
      console.log('User logged in:', user);
      setUser({ email: user.user.email });
      setHasCheckedProfileOnce(false);
      router.navigate('/(tabs)/home');
    }
  }, [user]);

  useEffect(() => {
    // Start animation when component mounts
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

  // Add this useEffect to handle authentication errors
  useEffect(() => {
    if (error) {
      console.log('Auth error:', error);

      // Set appropriate error message based on Firebase error code
      switch (error.code) {
        case 'auth/invalid-email':
          setAuthError('Invalid email format.');
          break;
        case 'auth/user-disabled':
          setAuthError('This account has been disabled.');
          break;
        case 'auth/user-not-found':
          setAuthError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setAuthError('Invalid password. Please try again.');
          break;
        case 'auth/invalid-credential':
          setAuthError('Invalid email or password. Please try again.');
          break;
        case 'auth/too-many-requests':
          setAuthError('Too many failed attempts. Try again later.');
          break;
        default:
          setAuthError('Login failed. Please try again.');
      }
    } else {
      // Clear error when no error exists
      setAuthError(null);
    }
  }, [error]);

  const validate = () => {
    let valid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else setEmailError(null);

    if (!password || password.length < 6) {
      console.log('inside password error');
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else setPasswordError(null);

    return valid;
  };

  const handleLogin = () => {
    if (validate()) {
      // Remove the try-catch to allow the error to be handled by the hook
      signInWithEmailAndPassword(email, password);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetError('Please enter your email');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess('Password reset email sent!');
      setResetError(null);
    } catch (err) {
      setResetError('Failed to send reset email. Try again.');
    }
  };

  const openDialog = () => {
    setResetEmail('');
    setResetError(null);
    setResetSuccess(null);
    setIsDialogVisible(true);
  };

  const closeDialog = () => setIsDialogVisible(false);

  const styles = getStyles(COLORS);

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

      {/* Login Form */}
      <View style={styles.form}>
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
        <HelperText
          type='error'
          visible={!!emailError}
          style={styles.helperText}
        >
          {emailError}
        </HelperText>

        <TextInput
          label='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={!!passwordError}
          style={styles.input}
          theme={{ colors: { primary: COLORS.primary } }}
        />
        <HelperText
          type='error'
          visible={!!passwordError}
          style={styles.helperText}
        >
          {passwordError}
        </HelperText>

        {authError && (
          <HelperText type='error' visible={true} style={styles.helperText}>
            {authError}
          </HelperText>
        )}

        <Button
          mode='contained'
          onPress={handleLogin}
          style={styles.button}
          loading={loading}
          disabled={loading}
          labelStyle={styles.buttonText}
        >
          {loading ? 'Logging In...' : 'Login'}
        </Button>

        <Button
          mode='text'
          onPress={openDialog}
          style={styles.forgotPassword}
          labelStyle={styles.forgotPasswordText}
        >
          Forgot Password?
        </Button>
      </View>

      {/* Reset Password Dialog */}
      <Portal>
        <Dialog visible={isDialogVisible} onDismiss={closeDialog}>
          <Dialog.Title style={styles.dialogTitle}>Reset Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label='Email'
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType='email-address'
              autoCapitalize='none'
              error={!!resetError}
              style={styles.input}
              theme={{ colors: { primary: COLORS.primary } }}
            />
            {resetError && (
              <HelperText type='error' visible={true} style={styles.helperText}>
                {resetError}
              </HelperText>
            )}
            {resetSuccess && (
              <HelperText type='info' visible={true} style={styles.successText}>
                {resetSuccess}
              </HelperText>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog} color={COLORS.primary}>
              Cancel
            </Button>
            <Button onPress={handleResetPassword} color={COLORS.primary}>
              Send
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: COLORS.background,
    },
    form: {
      width: '100%',
      maxWidth: 400,
      padding: 20,
      backgroundColor: COLORS.surface,
      borderRadius: 8,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    input: {
      marginBottom: 15,
      backgroundColor: COLORS.surface,
    },
    button: {
      marginTop: 10,
      backgroundColor: COLORS.primary,
    },
    buttonText: {
      color: COLORS.onPrimary,
      fontWeight: '600',
    },
    forgotPassword: {
      marginTop: 10,
    },
    forgotPasswordText: {
      color: COLORS.primary,
    },
    helperText: {
      color: COLORS.error,
      marginBottom: 5,
    },
    successText: {
      color: COLORS.primary,
      marginBottom: 5,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    logo: {
      width: 100,
      height: 100,
      borderRadius: 20,
      marginBottom: 10,
    },
    appName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: COLORS.primary,
      letterSpacing: 1,
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
    dialogTitle: {
      color: COLORS.text,
      fontWeight: 'bold',
    },
  });

export default Login;

