import { Alert } from 'react-native';
import {
  InterstitialAd,
  TestIds,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { getAdUnitId } from './adUnitIds';
import AdManager from './AdManager';

/**
 * Shows a support ad (using interstitial ad)
 * These are user-requested but should still reset the automatic ad timer
 */
export const showSupportAd = (onAdLoadStart, onAdLoadEnd, onRewarded) => {
  // Keep track of ad state to prevent duplicate alerts
  let isAdClosed = false;
  let timeoutId = null;

  try {
    // Call the loading start callback
    if (onAdLoadStart) onAdLoadStart();

    // Show loading state while ad loads
    Alert.alert(
      'Support Quotify',
      'Thank you for choosing to support us by watching an ad! Loading the ad...',
      [
        {
          text: 'Cancel',
          onPress: () => {
            isAdClosed = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (onAdLoadEnd) onAdLoadEnd(false);
          },
        },
      ]
    );

    // Create interstitial ad
    const interstitialAd = InterstitialAd.createForAdRequest(
      getAdUnitId('interstitial') || TestIds.INTERSTITIAL,
      {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['inspiration', 'quotes', 'motivation'],
      }
    );

    console.log('Support ad object created');

    // Use standard AdEventType for interstitials
    const loadedListener = interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        console.log('Support ad loaded successfully');
        // Clear timeout when ad loads
        if (timeoutId) clearTimeout(timeoutId);
        interstitialAd.show();
      }
    );

    const failedListener = interstitialAd.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        console.log('Support ad error:', error);
        isAdClosed = true;

        // Clear timeout when ad fails
        if (timeoutId) clearTimeout(timeoutId);

        if (onAdLoadEnd) onAdLoadEnd(false);

        Alert.alert(
          'Ad Unavailable',
          'Sorry, no ads are available right now. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    );

    const closedListener = interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        try {
          loadedListener();
          failedListener();
          closedListener();
        } catch (e) {
          console.log('Error cleaning up ad listeners:', e);
        }

        isAdClosed = true;

        // Clear timeout when ad closes
        if (timeoutId) clearTimeout(timeoutId);

        // IMPORTANT: Update AdManager's timing to prevent automatic ads
        // This prevents app open ads and navigation ads from showing right after
        AdManager.lastAnyAdShownTime = Date.now();
        AdManager.lastAdShowTime = Date.now();
        AdManager.navigationCounter = 0; // Reset navigation counter
        console.log('Support ad closed, automatic ad timers reset');

        // Also explicitly set AdManager's ad display flag to false
        AdManager.adDisplayInProgress = false;

        // Simulate the reward callback
        if (onRewarded) onRewarded({ amount: 1, type: 'support' });
        if (onAdLoadEnd) onAdLoadEnd(true);

        Alert.alert(
          'Thank You!',
          'Thanks for your support! Your contribution helps us improve Quotify.',
          [{ text: "You're welcome!" }]
        );
      }
    );

    // Load the ad
    interstitialAd.load();

    // Set timeout in case ad takes too long
    timeoutId = setTimeout(() => {
      // Only show alert if ad hasn't closed yet
      if (!isAdClosed) {
        try {
          loadedListener();
          failedListener();
          closedListener();
        } catch (e) {
          console.log('Error cleaning up ad listeners in timeout:', e);
        }

        if (onAdLoadEnd) onAdLoadEnd(false);

        Alert.alert(
          'Loading Timeout',
          'The ad is taking too long to load. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    }, 10000);

    // Return cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);

      // Don't try to clean up listeners if already done
      if (!isAdClosed) {
        try {
          loadedListener();
          failedListener();
          closedListener();
        } catch (e) {
          console.log('Error cleaning up ad listeners in cleanup:', e);
        }
      }
    };
  } catch (error) {
    console.log('Error showing support ad:', error);
    if (onAdLoadEnd) onAdLoadEnd(false);

    Alert.alert('Error', 'Something went wrong. Please try again later.', [
      { text: 'OK' },
    ]);
  }
};

