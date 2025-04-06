import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import styles from './RegisterForm.style'; // Importing the styles
import { useRouter } from 'expo-router';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from 'utils/firebase/firebaseconfig';
import { createUser } from 'utils/firebase/firestore';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);
  const router = useRouter();
  const [createUserWithEmailAndPassword, user, loading, error] =
    useCreateUserWithEmailAndPassword(auth);

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

    if (!confirmPassword || confirmPassword !== password) {
      setConfirmPasswordError('Passwords must match');
      valid = false;
    } else {
      setConfirmPasswordError(null);
    }

    return valid;
  };

  const handleRegister = async () => {
    if (validate()) {
      try {
        await createUserWithEmailAndPassword(email, password);
        await createUser({
          email,
        });
      } catch (error) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setEmailError(
              'This email is already registered. Please use a different email.'
            );
            break;
          case 'auth/invalid-email':
            setEmailError(
              'The email address is not valid. Please enter a valid email.'
            );
            break;
          case 'auth/weak-password':
            setPasswordError(
              'The password is too weak. Please use at least 6 characters.'
            );
            break;
          case 'auth/operation-not-allowed':
            console.error(
              'Email/password accounts are not enabled in Firebase settings.'
            );
            break;
          case 'auth/network-request-failed':
            console.error(
              'A network error occurred. Please check your connection.'
            );
            break;
          default:
            console.error('An unexpected error occurred:', error.message);
        }
      }
    }
  };

  useEffect(() => {
    if (user) {
      console.log('User registered successfully:', user);
      router.navigate('/(tabs)/home');
    }
  }, [user, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading</Text>
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

        <TextInput
          label='Confirm Password'
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={!!confirmPasswordError}
          style={styles.input}
        />
        {confirmPasswordError && (
          <HelperText type='error' style={styles.helperText}>
            {confirmPasswordError}
          </HelperText>
        )}

        <Button mode='contained' onPress={handleRegister} style={styles.button}>
          Register
        </Button>
      </View>
    </View>
  );
};

export default RegisterForm;

