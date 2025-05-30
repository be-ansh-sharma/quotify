import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { Platform } from 'react-native';

// Register background handler for Firebase messaging
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Message handled in the background:', remoteMessage);

  // For background messages, we don't need to create a visible notification
  // Firebase will automatically show the notification on Android
  // For iOS, we'll handle it only if needed
  if (Platform.OS === 'ios') {
    await notifee.displayNotification({
      title: remoteMessage.notification?.title || 'Quotify',
      body: remoteMessage.notification?.body,
      data: remoteMessage.data,
      ios: {
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    });
  }
});

// This must be after the background handler registration
import 'expo-router/entry';

