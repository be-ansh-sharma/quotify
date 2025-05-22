// utils/services/notificationService.js
import * as Notifications from 'expo-notifications';
import { storeFCMToken } from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { setupTokenRefreshListener } from './notifications/notifications';

export const setupNotificationHandlers = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received in foreground:', notification);
    }
  );

  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response received:', response);
      const data = response.notification.request.content.data;
      return data?.quoteId ? data : null;
    });

  return { foregroundSubscription, responseSubscription };
};

export const getInitialNotification = async () => {
  try {
    const initialNotification =
      await Notifications.getLastNotificationResponseAsync();
    if (initialNotification?.notification?.request?.content?.data) {
      const data = initialNotification.notification.request.content.data;
      return data?.quoteId ? data : null;
    }
    return null;
  } catch (err) {
    console.error('Error checking initial notification:', err);
    return null;
  }
};

export const getFCMToken = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return null;
      }
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '72429fcf-5b83-4cb5-b250-ffd6370f59bd',
    });
    return tokenData.data;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const setupUserNotifications = async (userProfile) => {
  try {
    setupTokenRefreshListener(userProfile.uid, false);

    const fcmToken = await getFCMToken();
    if (!fcmToken) return null;

    if (userProfile.fcmToken === fcmToken) {
      console.log('FCM token already up to date. Skipping update.');
      return userProfile.preferences;
    }

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

    return userProfile.preferences;
  } catch (error) {
    console.error('Error setting up user notifications:', error);
    return null;
  }
};

