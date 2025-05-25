import { useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import GoogleMobileAds from 'react-native-google-mobile-ads';
import useUserStore from 'stores/userStore';
import AdManager from 'utils/ads/AdManager';
import { clearAllQuotesCache } from 'utils/quotesCache';

export function useAdManager(isPremium) {
  const appState = useRef(AppState.currentState);
  const initialized = useRef(false);
  const lastCacheClear = useRef(0);
  const user = useUserStore((state) => state.user);
  const CACHE_CLEAR_INTERVAL = 3600000; // Clear cache at most once per hour (3600000ms)
  const shortBackgroundDuration = useRef(0);

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

      // Initialize our ad manager
      AdManager.initialize();
    } catch (error) {
      console.error('Error initializing mobile ads:', error);
    }
  }, []);

  // Load interstitial ad
  const loadInterstitialAd = useCallback(() => {
    if (isPremium) return null;

    // Let the AdManager handle loading
    AdManager.loadInterstitialAd();
    return null; // No cleanup needed - managed by singleton
  }, [isPremium]);

  // Check and show interstitial ad when navigating
  const checkAndShowInterstitial = useCallback(
    (currentPath, previousPath) => {
      if (isPremium || !previousPath || previousPath === currentPath)
        return false;

      return AdManager.trackNavigation(isPremium, previousPath, currentPath);
    },
    [isPremium]
  );

  // Handle app state changes for App Open ads & cache clearing
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        const now = Date.now();

        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // Calculate time spent in background
          const timeInBackground = now - shortBackgroundDuration.current;
          console.log('App has come to the foreground!');

          if (
            now - lastCacheClear.current > CACHE_CLEAR_INTERVAL ||
            timeInBackground > 300000
          ) {
            console.log('Clearing quotes cache (periodic or long background)');
            await clearAllQuotesCache();
            lastCacheClear.current = now;
          } else {
            console.log(
              'Skipping cache clear - app was likely just showing an ad'
            );
          }

          // Only show app open ad if we're not in cooldown
          if (!isPremium && user?.uid && AdManager.canShowAd()) {
            AdManager.showAppOpenAd(isPremium);
          } else {
            console.log('AdManager: Skipping app open ad on app foreground');
          }
        } else if (
          appState.current === 'active' &&
          nextAppState.match(/inactive|background/)
        ) {
          console.log('App going to background');
          shortBackgroundDuration.current = now; // Record when app went to background

          // Only prepare for next open if no ads were shown recently
          if (!isPremium && user?.uid && AdManager.canShowAd()) {
            console.log('App going to background, preparing ad for next open');
            setTimeout(() => {
              AdManager.loadAppOpenAd();
            }, 2000);
          } else {
            console.log(
              'AdManager: Skipping app open ad preparation - in cooldown period'
            );
          }
        }

        // Update app state
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isPremium, user?.uid]);

  // Initialize cache clear timestamp on mount
  useEffect(() => {
    const now = Date.now();
    if (now - lastCacheClear.current > CACHE_CLEAR_INTERVAL) {
      // Cache is stale, clear it
      clearAllQuotesCache();
      lastCacheClear.current = now;
      console.log('Clearing quotes cache on cold start');
    } else {
      lastCacheClear.current = now;
    }
  }, []);

  // Clean up when isPremium changes
  useEffect(() => {
    if (isPremium) {
      AdManager.reset();
    }
  }, [isPremium]);

  // Update auth state when user changes
  useEffect(() => {
    const isLoggedIn = !!user?.uid; // Check if user is logged in
    AdManager.setAuthState(isLoggedIn);
  }, [user]);

  return {
    initializeMobileAds,
    loadInterstitialAd,
    checkAndShowInterstitial,
  };
}

