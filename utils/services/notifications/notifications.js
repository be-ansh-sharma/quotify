import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { storeFCMToken } from 'utils/firebase/firestore';
import messaging from '@react-native-firebase/messaging';

/**
 * Request notification permissions from the user
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    }
    // Android automatically grants permission
    return true;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
};

/**
 * Get the FCM token for the device
 */
export const getFCMToken = async () => {
  try {
    // Request permission first if needed
    if (Platform.OS === 'ios') {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        return null;
      }
    }

    const token = await messaging().getToken();
    console.log('FCM Token:', token);

    // Store token locally
    await AsyncStorage.setItem('fcm_token', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Set up token refresh listener
 */
export const setupTokenRefreshListener = (userId) => {
  return messaging().onTokenRefresh(async (newToken) => {
    console.log('FCM Token refreshed:', newToken);

    try {
      if (userId) {
        await storeFCMToken(userId, newToken, false);
      }
      await AsyncStorage.setItem('fcm_token', newToken);
    } catch (error) {
      console.error('Error handling token refresh:', error);
    }
  });
};

