import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  HelperText,
  Divider,
  Text,
  Avatar,
  Surface,
  IconButton,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth } from 'utils/firebase/firebaseconfig';
import { updateProfile } from 'firebase/auth';
import { updateUserProfile } from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { useAppTheme } from 'context/AppThemeContext';
import { showMessage } from 'react-native-flash-message';
import Header from 'components/header/Header';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUpdatePassword } from 'react-firebase-hooks/auth';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export default function EditProfile() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Use the Firebase hook for password updates
  const [updatePassword, updating, updateError] = useUpdatePassword(auth);

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

      showMessage({
        message: 'Profile updated successfully',
        type: 'success',
      });
      router.push('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage({
        message: 'Failed to update profile. Please try again.',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // Updated password handler using the hook
  const handlePasswordUpdate = async () => {
    if (!validatePassword()) return;

    try {
      await updatePassword(password);
      showMessage({
        message: 'Password updated successfully',
        type: 'success',
      });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);

      // Check if this is a re-authentication required error
      if (error.code === 'auth/requires-recent-login') {
        setError(null); // Clear any previous errors
        setShowReauthDialog(true); // Show the dialog
      } else {
        showMessage({
          message: 'Failed to update password. Please try again.',
          type: 'danger',
        });
      }
    }
  };

  // Add a reauthentication handler
  const handleReauthenticate = async () => {
    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);
      setShowReauthDialog(false);

      // Retry password update after successful reauthentication
      const success = await updatePassword(password);
      if (success) {
        showMessage({
          message: 'Password updated successfully',
          type: 'success',
        });
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Reauthentication error:', error);
      setError('Incorrect password. Please try again.');
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
          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={80}
              label={`${firstName.charAt(0)}${lastName.charAt(0)}`}
              style={styles.avatar}
              color={COLORS.onPrimary}
              backgroundColor={COLORS.primary}
            />
            <Text style={styles.avatarEditText}>Edit Profile</Text>
          </View>

          {/* Profile Section */}
          <Surface style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name='account'
                size={24}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                label='First Name'
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                mode='outlined'
                outlineColor={COLORS.outline}
                activeOutlineColor={COLORS.primary}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name='account'
                size={24}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                label='Last Name'
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
                mode='outlined'
                outlineColor={COLORS.outline}
                activeOutlineColor={COLORS.primary}
              />
            </View>

            <Button
              mode='contained'
              onPress={handleProfileUpdate}
              loading={loading}
              disabled={loading}
              style={styles.button}
              labelStyle={styles.buttonText}
              icon='content-save'
            >
              Save Profile
            </Button>
          </Surface>

          {/* Password Section */}
          <Surface style={styles.card}>
            <Text style={styles.sectionTitle}>Security</Text>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name='key'
                size={24}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                label='New Password'
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                mode='outlined'
                outlineColor={COLORS.outline}
                activeOutlineColor={COLORS.primary}
                right={<TextInput.Icon icon='eye' />}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name='key-chain'
                size={24}
                color={COLORS.primary}
                style={styles.inputIcon}
              />
              <TextInput
                label='Confirm Password'
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
                mode='outlined'
                outlineColor={COLORS.outline}
                activeOutlineColor={COLORS.primary}
                right={<TextInput.Icon icon='eye' />}
              />
            </View>

            {error && (
              <HelperText type='error' style={styles.helperText}>
                {error}
              </HelperText>
            )}

            <Button
              mode='contained'
              onPress={handlePasswordUpdate}
              loading={updating} // Use updating from the hook
              disabled={updating} // Use updating from the hook
              style={styles.button}
              labelStyle={styles.buttonText}
              icon='lock-reset'
            >
              Update Password
            </Button>
          </Surface>

          <Button
            mode='outlined'
            onPress={() => router.back()}
            style={styles.cancelButton}
            labelStyle={styles.cancelButtonText}
            icon='close'
          >
            Cancel
          </Button>

          {/* Reauthentication Dialog */}
          {showReauthDialog && (
            <Surface style={[styles.card, styles.dialogCard]}>
              <Text style={styles.dialogTitle}>
                Please confirm your password
              </Text>
              <Text style={styles.dialogSubtitle}>
                For security reasons, please verify your current password
              </Text>

              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name='shield-key'
                  size={24}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  label='Current Password'
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  style={styles.input}
                  mode='outlined'
                  outlineColor={COLORS.outline}
                  activeOutlineColor={COLORS.primary}
                />
              </View>

              {error && (
                <HelperText type='error' style={styles.helperText}>
                  {error}
                </HelperText>
              )}

              <View style={styles.dialogButtonContainer}>
                <Button
                  mode='outlined'
                  onPress={() => setShowReauthDialog(false)}
                  style={styles.dialogButton}
                >
                  Cancel
                </Button>
                <Button
                  mode='contained'
                  onPress={handleReauthenticate}
                  style={styles.dialogButton}
                >
                  Confirm
                </Button>
              </View>
            </Surface>
          )}
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
      paddingBottom: 40,
    },
    card: {
      padding: 20,
      borderRadius: 16,
      marginBottom: 24,
      backgroundColor: COLORS.surface,
      elevation: 2,
    },
    avatarContainer: {
      alignItems: 'center',
      marginVertical: 20,
    },
    avatar: {
      marginBottom: 8,
    },
    avatarEditText: {
      color: COLORS.primary,
      fontWeight: '600',
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 20,
      color: COLORS.text,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    helperText: {
      marginBottom: 8,
    },
    button: {
      marginTop: 12,
      borderRadius: 8,
      backgroundColor: COLORS.primary,
      paddingVertical: 6,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      marginTop: 8,
      borderRadius: 8,
      borderColor: COLORS.outline,
      borderWidth: 1,
    },
    cancelButtonText: {
      fontSize: 14,
      color: COLORS.primary,
    },
    dialogCard: {
      position: 'absolute',
      top: '25%', // Position at 25% from the top
      left: 20,
      right: 20,
      zIndex: 1000, // Ensure it's on top of everything
      padding: 20,
      borderRadius: 16,
      backgroundColor: COLORS.surface,
      elevation: 8, // Higher elevation for better shadow on Android
      shadowColor: '#000', // iOS shadow
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    dialogTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 20,
      color: COLORS.text,
    },
    dialogSubtitle: {
      fontSize: 14,
      marginBottom: 20,
      color: COLORS.text,
    },
    dialogButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    dialogButton: {
      flex: 1,
      marginHorizontal: 8,
    },
  });

