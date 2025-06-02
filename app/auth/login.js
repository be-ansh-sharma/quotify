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
import { ensureUserDocument } from 'utils/firebase/firestore'; // Add this import
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
  const [isCreatingUser, setIsCreatingUser] = useState(false); // Add loading state

  // New state for password visibility
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);

  const setUser = useUserStore((state) => state.setUser);
  const setHasCheckedProfileOnce = useUserStore(
    (state) => state.setHasCheckedProfileOnce
  );

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Update the useEffect that handles successful login
  useEffect(() => {
    const handleSuccessfulLogin = async () => {
      if (user) {
        try {
          setIsCreatingUser(true);
          console.log('User logged in successfully:', user?.user?.email);

          // Ensure user document exists in Firestore
          const userData = await ensureUserDocument(user.user);

          // Set user in store with the complete user data
          setUser(userData);
          setHasCheckedProfileOnce(false);

          router.navigate('/(tabs)/home');
        } catch (error) {
          console.error('Error ensuring user document:', error);
          setAuthError('Failed to complete login setup. Please try again.');
        } finally {
          setIsCreatingUser(false);
        }
      }
    };

    handleSuccessfulLogin();
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

    if (!password) {
      setPasswordError('Please enter your password');
      valid = false;
    } else setPasswordError(null);

    return valid;
  };

  const handleLogin = () => {
    if (validate()) {
      // Clear any existing auth errors
      setAuthError(null);
      signInWithEmailAndPassword(email, password);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setResetError('Please enter a valid email address');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess('Password reset email sent!');
      setResetError(null);
      // Close the dialog after a delay
      setTimeout(() => {
        closeDialog();
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.code === 'auth/user-not-found') {
        setResetError('No account found with this email.');
      } else {
        setResetError('Failed to send reset email. Try again.');
      }
    }
  };

  const openDialog = () => {
    setResetEmail(email); // Pre-fill with the email they were trying to use
    setResetError(null);
    setResetSuccess(null);
    setIsDialogVisible(true);
  };

  const closeDialog = () => setIsDialogVisible(false);

  const styles = getStyles(COLORS);

  // Update the loadingText logic
  const isLoading = loading || isCreatingUser;

  // Alternative approach - more explicit:
  const getButtonText = () => {
    if (isCreatingUser) return 'Setting up account...';
    if (loading) return 'Logging In...';
    return 'Login';
  };

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
          disabled={isLoading}
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
          secureTextEntry={!passwordVisible}
          error={!!passwordError}
          style={styles.input}
          theme={{ colors: { primary: COLORS.primary } }}
          disabled={isLoading}
          right={
            <TextInput.Icon
              icon={passwordVisible ? 'eye-off' : 'eye'}
              onPress={() => setPasswordVisible(!passwordVisible)}
              color={COLORS.text}
              disabled={isLoading}
            />
          }
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
          loading={isLoading}
          disabled={isLoading}
          contentStyle={{ paddingVertical: 6 }}
          labelStyle={styles.buttonText}
        >
          {getButtonText()}
        </Button>

        <Button
          mode='text'
          onPress={openDialog}
          style={styles.forgotPassword}
          labelStyle={styles.forgotPasswordText}
          disabled={isLoading}
        >
          Forgot Password?
        </Button>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account?</Text>
          <Button
            mode='text'
            onPress={() => router.push('/auth/register')}
            style={styles.registerButton}
            labelStyle={styles.registerButtonText}
            disabled={isLoading}
          >
            Register
          </Button>
        </View>
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
            <Button
              onPress={handleResetPassword}
              color={COLORS.primary}
              disabled={!resetEmail}
            >
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
      marginBottom: 8,
      backgroundColor: COLORS.surface,
    },
    button: {
      marginTop: 10,
      backgroundColor: COLORS.primary,
      borderRadius: 8,
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
    registerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    registerText: {
      color: COLORS.text,
      fontSize: 14,
    },
    registerButton: {
      marginLeft: 4,
    },
    registerButtonText: {
      color: COLORS.primary,
      fontWeight: '600',
    },
  });

export default Login;

