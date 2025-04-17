import React, { useState, useEffect } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  HelperText,
  Dialog,
  Portal,
  useTheme,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from 'utils/firebase/firebaseconfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import useUserStore from 'stores/userStore';
import styles from './LoginForm.style';
import { COLORS } from 'styles/theme';

const LoginForm = () => {
  const theme = useTheme();
  const router = useRouter();

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
  const resetGuest = useUserStore((state) => state.resetGuest);

  useEffect(() => {
    if (user) {
      resetGuest();
      setUser({ email: user.user.email });
      setHasCheckedProfileOnce(false);
      router.navigate('/(tabs)/home');
    }
  }, [user]);

  const validate = () => {
    let valid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else setEmailError(null);

    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else setPasswordError(null);

    return valid;
  };

  const handleLogin = async () => {
    if (validate()) {
      try {
        await signInWithEmailAndPassword(email, password);
      } catch (err) {
        setAuthError('Invalid email or password. Please try again.');
      }
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form}>
        <TextInput
          label='Email'
          value={email}
          onChangeText={setEmail}
          keyboardType='email-address'
          autoCapitalize='none'
          error={!!emailError}
          style={styles.input}
        />
        <HelperText type='error' visible={!!emailError}>
          {emailError}
        </HelperText>

        <TextInput
          label='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={!!passwordError}
          style={styles.input}
        />
        <HelperText type='error' visible={!!passwordError}>
          {passwordError}
        </HelperText>

        {authError && (
          <HelperText type='error' visible={true}>
            {authError}
          </HelperText>
        )}

        <Button
          mode='contained'
          onPress={handleLogin}
          style={styles.button}
          loading={loading}
          disabled={loading}
          labelStyle={{ color: COLORS.icon }}
        >
          {loading ? 'Logging In...' : 'Login'}
        </Button>

        <Button
          mode='text'
          onPress={openDialog}
          style={styles.forgotPassword}
          labelStyle={{ color: theme.colors.primary }}
        >
          Forgot Password?
        </Button>
      </View>

      <Portal>
        <Dialog visible={isDialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>Reset Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label='Email'
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType='email-address'
              autoCapitalize='none'
              error={!!resetError}
              style={styles.input}
            />
            {resetError && (
              <HelperText type='error' visible={true}>
                {resetError}
              </HelperText>
            )}
            {resetSuccess && (
              <HelperText type='info' visible={true}>
                {resetSuccess}
              </HelperText>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button onPress={handleResetPassword}>Send</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

export default LoginForm;

