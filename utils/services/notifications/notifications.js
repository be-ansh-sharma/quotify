import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storeFCMToken } from 'utils/firebase/firestore';

/**
 * Set up a listener for FCM token refresh.
 * @param {string|null} userId - The ID of the logged-in user.
 */
export const setupTokenRefreshListener = (userId) => {
  Notifications.addPushTokenListener(async (tokenData) => {
    const newToken = tokenData.data;
    const oldToken = await AsyncStorage.getItem('fcm_token');

    console.log('FCM Token refreshed:', newToken);

    try {
      if (userId) {
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

