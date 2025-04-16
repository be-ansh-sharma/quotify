import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Title, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth } from 'utils/firebase/firebaseconfig';
import { createUser } from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';

const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);

  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  const [createUserWithEmailAndPassword, user, loading, error] =
    useCreateUserWithEmailAndPassword(auth);

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
    <View style={styles.container}>
      <Title style={styles.title}>Create Account</Title>

      <TextInput
        label='Email'
        value={email}
        onChangeText={setEmail}
        keyboardType='email-address'
        autoCapitalize='none'
        error={!!emailError}
        style={styles.input}
      />
      {emailError && <HelperText type='error'>{emailError}</HelperText>}

      <TextInput
        label='Password'
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={!!passwordError}
        style={styles.input}
      />
      {passwordError && <HelperText type='error'>{passwordError}</HelperText>}

      <TextInput
        label='Confirm Password'
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        error={!!confirmPasswordError}
        style={styles.input}
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
      >
        Register
      </Button>
    </View>
  );
};

export default RegisterForm;

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
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
});

