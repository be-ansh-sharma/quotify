// utils/services/authService.js
import { auth } from 'utils/firebase/firebaseconfig';
import { fetchUserProfile } from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const handleAuthentication = async (user, router) => {
  try {
    const userProfile = await fetchUserProfile(user.email);

    if (!userProfile) {
      await auth.signOut();
      router.push('/auth/entry');
      return null;
    }
    await handleUserTransition(userProfile);

    // Track login for offline mode
    await AsyncStorage.setItem('lastSuccessfulLogin', Date.now().toString());

    // Setup FCM token
    const { setupUserNotifications } = await import('./notificationService');
    await setupUserNotifications(userProfile);

    return userProfile;
  } catch (err) {
    console.error('Error handling authentication:', err);
    throw err;
  }
};

/**
 * Handles setting the new user in the user store
 * @param {object} newUser - The user profile data to set
 * @returns {Promise<boolean>} Success status
 */
export const handleUserTransition = async (newUser) => {
  try {
    // Simply reset the store and set the new user
    useUserStore.getState().resetUser();

    // Set authenticated user
    useUserStore.getState().setUser(newUser);

    console.log('User state updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating user state:', error);
    return false;
  }
};

