import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [offlinePreviouslyLoggedIn, setOfflinePreviouslyLoggedIn] =
    useState(false);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });

    // Check for persisted auth on mount
    const checkPersistedAuth = async () => {
      try {
        const persistedAuth = await AsyncStorage.getItem('persistedAuthUser');
        if (persistedAuth) {
          setOfflinePreviouslyLoggedIn(true);
        }
      } catch (e) {
        console.error('Error reading persisted auth:', e);
      }
    };

    checkPersistedAuth();

    return () => {
      unsubscribeNetInfo();
    };
  }, []);

  return { isOnline, offlinePreviouslyLoggedIn };
}

