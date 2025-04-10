import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, HelperText, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth } from 'utils/firebase/firebaseconfig';
import { updateProfile } from 'firebase/auth';
import { updateUserProfile } from 'utils/firebase/firestore'; // Function to update user profile in Firestore
import useUserStore from 'stores/userStore';

export default function EditProfile() {
  const router = useRouter();
  const user = useUserStore((state) => state.user); // Get the current user
  const setUser = useUserStore((state) => state.setUser); // Update user in the store

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
      // Update user profile in Firestore
      const updatedProfile = {
        firstName,
        lastName,
      };
      await updateUserProfile(user.email, updatedProfile);

      // Update user profile in the store
      setUser({ ...user, ...updatedProfile });

      Alert.alert('Success', 'Profile updated successfully');
      router.back(); // Navigate back to the profile screen
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
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
      Alert.alert('Success', 'Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Profile Update Section */}
      <TextInput
        label='First Name'
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />
      <TextInput
        label='Last Name'
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
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

      {/* Password Update Section */}
      <TextInput
        label='New Password'
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <TextInput
        label='Confirm Password'
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
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
      >
        Cancel
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
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
    backgroundColor: '#ddd',
  },
});
