import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Fields */}
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
      </ScrollView>
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
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.onPrimary || '#fff',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: COLORS.text,
  },
  input: {
    marginBottom: 16,
  },
  helperText: {
    marginBottom: 8,
  },
  button: {
    marginTop: 4,
    borderRadius: 8,
  },
  cancelButton: {
    marginTop: 24,
    alignSelf: 'center',
  },
  divider: {
    marginVertical: 32,
    height: 1,
    backgroundColor: COLORS.surface,
  },
});

