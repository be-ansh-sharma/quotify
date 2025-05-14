import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  HelperText,
  Divider,
  Text,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth } from 'utils/firebase/firebaseconfig';
import { updateProfile } from 'firebase/auth';
import { updateUserProfile } from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { useAppTheme } from 'context/AppThemeContext';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import Header from 'components/header/Header';

export default function EditProfile() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  const validatePassword = () => {
    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    setError(null);
    return true;
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const updatedProfile = { firstName, lastName };

      await updateUserProfile(user.uid, updatedProfile);

      const currentUser = auth.currentUser;
      await updateProfile(currentUser, {
        displayName: `${firstName} ${lastName}`,
      });

      setUser({ ...user, ...updatedProfile });

      SnackbarService.show('Profile updated successfully');
      router.push('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      SnackbarService.show('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      await auth.currentUser.updatePassword(password);
      SnackbarService.show('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      SnackbarService.show('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title='Edit Profile' backRoute='/profile' />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile Section */}
          <Text style={styles.sectionTitle}>Profile Info</Text>
          <TextInput
            label='First Name'
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
            theme={{
              colors: { text: COLORS.text, placeholder: COLORS.placeholder },
            }}
          />
          <TextInput
            label='Last Name'
            value={lastName}
            onChangeText={setLastName}
            style={styles.input}
            theme={{
              colors: { text: COLORS.text, placeholder: COLORS.placeholder },
            }}
          />
          <Button
            mode='contained'
            onPress={handleProfileUpdate}
            loading={loading}
            disabled={loading}
            style={styles.button}
            labelStyle={styles.buttonText}
          >
            Save Profile
          </Button>

          <Divider style={styles.divider} />

          {/* Password Section */}
          <Text style={styles.sectionTitle}>Change Password</Text>
          <TextInput
            label='New Password'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            theme={{
              colors: { text: COLORS.text, placeholder: COLORS.placeholder },
            }}
          />
          <TextInput
            label='Confirm Password'
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            theme={{
              colors: { text: COLORS.text, placeholder: COLORS.placeholder },
            }}
          />
          {error && (
            <HelperText type='error' style={styles.helperText}>
              {error}
            </HelperText>
          )}
          <Button
            mode='contained'
            onPress={handlePasswordUpdate}
            loading={loading}
            disabled={loading}
            style={styles.button}
            labelStyle={styles.buttonText}
          >
            Update Password
          </Button>

          <Button
            mode='text'
            onPress={() => router.back()}
            style={styles.cancelButton}
            labelStyle={styles.cancelButtonText}
          >
            Cancel
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    content: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
      color: COLORS.text,
    },
    input: {
      marginBottom: 16,
      backgroundColor: COLORS.surface,
    },
    helperText: {
      marginBottom: 8,
    },
    button: {
      marginTop: 8,
      borderRadius: 8,
      backgroundColor: COLORS.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.onPrimary,
    },
    cancelButton: {
      marginTop: 24,
      alignSelf: 'center',
    },
    cancelButtonText: {
      fontSize: 14,
      color: COLORS.placeholder,
    },
    divider: {
      marginVertical: 32,
      height: 1,
      backgroundColor: COLORS.surfaceVariant,
    },
  });

