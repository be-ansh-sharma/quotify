import { Platform } from 'react-native';
import notifee, { EventType, AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { storeFCMToken } from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import {
  getFCMToken,
  setupTokenRefreshListener,
} from './notifications/notifications';

/**
 * Set up notification handlers for foreground and background
 * @returns {Object} Subscription cleanup functions
 */
export const setupNotificationHandlers = () => {
  // Create a channel for Android notifications
  const createChannel = async () => {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        vibration: true,
        sound: 'default',
      });
    }
  };

  createChannel();

  // Handle foreground messages using Firebase Messaging
  const foregroundSubscription = messaging().onMessage(
    async (remoteMessage) => {
      console.log('Notification received in foreground:', remoteMessage);

      // Only display notification when app is in foreground
      // We don't need to handle background notifications here since that's done by
      // the background handler in index.js
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'Quotify',
        body: remoteMessage.notification?.body,
        data: remoteMessage.data,
        android: {
          channelId: 'default',
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
        },
      });
    }
  );

  // Handle notification press events using Notifee
  const responseSubscription = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      console.log('User pressed notification:', detail.notification);
      // Return a simple flag instead of specific data
      return { pressed: true };
    }
  });

  console.log('Notification handlers setup with native Firebase SDK');

  return { foregroundSubscription, responseSubscription };
};

/**
 * Get the initial notification that launched the app
 * @returns {Promise<Object|null>} Notification data
 */
export const getInitialNotification = async () => {
  try {
    // Check if the app was opened from a Firebase notification
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      console.log('App opened from Firebase notification:', remoteMessage);
      // Return simplified data without quoteId
      return { pressed: true };
    }

    // Also check if the app was opened from a Notifee notification
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification) {
      console.log('App opened from Notifee notification:', initialNotification);
      // Return simplified data without quoteId
      return { pressed: true };
    }

    return null;
  } catch (err) {
    console.error('Error checking initial notification:', err);
    return null;
  }
};

/**
 * Set up notifications for a user
 * @param {Object} userProfile User profile data
 * @returns {Promise<Object|null>} User preferences
 */
export const setupUserNotifications = async (userProfile) => {
  try {
    // Set up token refresh listener
    const unsubscribe = setupTokenRefreshListener(userProfile.uid);

    // Get and store FCM token
    const fcmToken = await getFCMToken();
    if (!fcmToken) return null;

    if (userProfile.fcmToken === fcmToken) {
      console.log('FCM token already up to date. Skipping update.');
      return userProfile.preferences;
    }

    // Store the token in firestore
    const defaultPreferences = await storeFCMToken(
      userProfile.uid,
      fcmToken,
      false,
      userProfile
    );

    useUserStore.getState().setUser({
      ...userProfile,
      fcmToken,
      preferences: userProfile.preferences || defaultPreferences,
    });

    console.log('User notifications setup with native Firebase SDK');

    return userProfile.preferences || defaultPreferences;
  } catch (error) {
    console.error('Error setting up user notifications:', error);
    return userProfile.preferences;
  }
};

