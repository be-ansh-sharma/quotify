import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  handleGuestTokenRefresh,
  storeFCMToken,
} from 'utils/firebase/firestore';

/**
 * Set up a listener for FCM token refresh.
 * @param {string|null} userId - The ID of the logged-in user (null for guests).
 * @param {boolean} isGuest - Whether the user is a guest.
 */
export const setupTokenRefreshListener = (userId, isGuest) => {
  Notifications.addPushTokenListener(async (tokenData) => {
    const newToken = tokenData.data;
    const oldToken = await AsyncStorage.getItem('fcm_token');

    console.log('FCM Token refreshed:', newToken);

    try {
      if (isGuest) {
        // Handle token refresh for guest users
        if (oldToken && oldToken !== newToken) {
          await handleGuestTokenRefresh(oldToken, newToken);
        }
      } else if (userId) {
        // Update the token for logged-in users
        await storeFCMToken(userId, newToken, false);
      }

      // Save the new token locally
      await AsyncStorage.setItem('fcm_token', newToken);
    } catch (error) {
      console.error('Error handling token refresh:', error);
    }
  });
};
