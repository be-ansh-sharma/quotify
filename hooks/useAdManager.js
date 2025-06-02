import { useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import GoogleMobileAds from 'react-native-google-mobile-ads';
import useUserStore from 'stores/userStore';
import AdManager from 'utils/ads/AdManager';

export function useAdManager(isPremium) {
  const appState = useRef(AppState.currentState);
  const initialized = useRef(false);
  const user = useUserStore((state) => state.user);

  // Initialize Mobile Ads SDK
  const initializeMobileAds = useCallback(async () => {
    if (initialized.current) {
      console.log('Mobile ads already initialized');
      return;
    }

    try {
      await GoogleMobileAds().initialize();
      console.log('Mobile ads initialized successfully');
      initialized.current = true;

      // Initialize our simplified ad manager
      AdManager.initialize();
    } catch (error) {
      console.error('Error initializing mobile ads:', error);
    }
  }, []);

  // Simple app state handling
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App has come to the foreground!');

        // Try to show app open ad
        if (!isPremium && user?.uid) {
          AdManager.onAppForeground(isPremium);
        }
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('App going to background');
        // App open ads will be loaded when needed
      }

      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isPremium, user?.uid]);

  // Update auth state
  useEffect(() => {
    const isLoggedIn = !!user?.uid;
    AdManager.setAuthState(isLoggedIn);
  }, [user]);

  return {
    initializeMobileAds,
    getAdStatus: () => AdManager.getStatus(),
  };
}

