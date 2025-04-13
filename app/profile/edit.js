import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { TextInput, Button, HelperText, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth } from 'utils/firebase/firebaseconfig';
import { updateProfile } from 'firebase/auth';
import { updateUserProfile } from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from 'styles/theme';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';

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
      const updatedProfile = {
        firstName,
        lastName,
      };

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
      const currentUser = auth.currentUser;
      await currentUser.updatePassword(password);

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <View style={styles.content}>
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
        >
          Update Profile
        </Button>

        <Divider style={styles.divider} />

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
        >
          Update Password
        </Button>

        <Button
          mode='text'
          onPress={() => router.back()}
          style={styles.cancelButton}
          textColor={COLORS.placeholder}
        >
          Cancel
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  helperText: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 24,
    height: 1,
    backgroundColor: COLORS.surface,
  },
});

