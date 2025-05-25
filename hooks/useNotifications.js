import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  setupNotificationHandlers,
  getInitialNotification,
} from 'utils/services/notificationService';

export function useNotifications(isLayoutMounted, isInitialRouteSet) {
  const [notificationData, setNotificationData] = useState(null);
  const router = useRouter();

  // Set up notification handlers
  useEffect(() => {
    const { foregroundSubscription, responseSubscription } =
      setupNotificationHandlers();

    // Handle notifications
    (async () => {
      const initialNotificationData = await getInitialNotification();
      if (initialNotificationData) setNotificationData(initialNotificationData);
    })();

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // Handle notification navigation
  useEffect(() => {
    if (notificationData?.quoteId && isLayoutMounted && isInitialRouteSet) {
      router.navigate('/(tabs)/home');
      setNotificationData(null);
    }
  }, [notificationData, isLayoutMounted, isInitialRouteSet, router]);

  return { notificationData };
}

