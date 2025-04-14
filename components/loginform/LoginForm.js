import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import {
  TextInput,
  Button,
  HelperText,
  Dialog,
  Portal,
  Paragraph,
} from 'react-native-paper';
import styles from './LoginForm.style'; // Importing the styles
import { useRouter } from 'expo-router';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from 'utils/firebase/firebaseconfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import useUserStore from 'stores/userStore';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [authError, setAuthError] = useState(null); // Handle Firebase auth errors
  const [resetEmail, setResetEmail] = useState(''); // Email for password reset
  const [isDialogVisible, setIsDialogVisible] = useState(false); // Dialog visibility
  const [resetError, setResetError] = useState(null); // Error for reset email
  const [resetSuccess, setResetSuccess] = useState(null); // Success message for reset email
  const router = useRouter();
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const setUser = useUserStore((state) => state.setUser);
  const setHasCheckedProfileOnce = useUserStore(
    (state) => state.setHasCheckedProfileOnce
  );
  const resetGuest = useUserStore((state) => state.resetGuest);

  useEffect(() => {
    if (user) {
      console.log('User logged in successfully:', user);
      resetGuest();
      setUser({
        email: user.user.email,
      });
      setHasCheckedProfileOnce(false);
      router.navigate('/(tabs)/home');
    }
  }, [user]);

  const validate = () => {
    let valid = true;

    // Email regex for basic validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError(null);
    }

    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError(null);
    }

    return valid;
  };

  const handleLogin = async () => {
    if (validate()) {
      try {
        await signInWithEmailAndPassword(email, password);
      } catch (error) {
        console.error(error.message);
        setAuthError('Invalid email or password. Please try again.');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetError('Please enter your email address');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess('Password reset email sent successfully!');
      setResetError(null);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      setResetError('Failed to send password reset email. Please try again.');
    }
  };

  const openDialog = () => {
    setResetEmail(''); // Clear the email field
    setResetError(null); // Clear any previous errors
    setResetSuccess(null); // Clear any previous success messages
    setIsDialogVisible(true);
  };

  const closeDialog = () => {
    setIsDialogVisible(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        {emailError && (
          <HelperText type='error' style={styles.helperText}>
            {emailError}
          </HelperText>
        )}

        <TextInput
          label='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={!!passwordError}
          style={styles.input}
        />
        {passwordError && (
          <HelperText type='error' style={styles.helperText}>
            {passwordError}
          </HelperText>
        )}

        {authError && (
          <HelperText type='error' style={styles.helperText}>
            {authError}
          </HelperText>
        )}

        <Button mode='contained' onPress={handleLogin} style={styles.button}>
          Login
        </Button>

        {/* Forgot Password Button */}
        <Button mode='text' onPress={openDialog} style={styles.forgotPassword}>
          Forgot Password?
        </Button>
      </View>

      {/* Reset Password Dialog */}
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
              <HelperText type='error' style={styles.helperText}>
                {resetError}
              </HelperText>
            )}
            {resetSuccess && (
              <HelperText type='info' style={styles.helperText}>
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
    </View>
  );
};

export default LoginForm;

