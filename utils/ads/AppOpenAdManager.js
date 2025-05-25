import {
  AppOpenAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { getAdUnitId } from './adUnitIds';

class AppOpenAdManager {
  constructor() {
    this.appOpenAd = null;
    this.isLoaded = false;
    this.isShowingAd = false;
    this.lastShowTime = 0;
    this.loadTimeoutId = null;
    this.MIN_INTERVAL = 4 * 60 * 1000; // 4 minutes between app open ads

    // Cleanup and listener references
    this.loadedListener = null;
    this.closedListener = null;
    this.errorListener = null;
  }

  /**
   * Safely clean up resources
   */
  safeCleanup() {
    try {
      // Clean up listeners with safety checks
      if (this.loadedListener && typeof this.loadedListener === 'function') {
        this.loadedListener();
        this.loadedListener = null;
      }

      if (this.closedListener && typeof this.closedListener === 'function') {
        this.closedListener();
        this.closedListener = null;
      }

      if (this.errorListener && typeof this.errorListener === 'function') {
        this.errorListener();
        this.errorListener = null;
      }

      // Handle the appOpenAd instance itself
      if (this.appOpenAd) {
        // Don't attempt to call destroy - it seems to be causing issues
        this.appOpenAd = null;
      }

      this.isLoaded = false;
      this.isShowingAd = false;
    } catch (e) {
      console.log('AppOpenAd: Error in safe cleanup:', e);
    }
  }

  /**
   * Load an app open ad
   */
  loadAd() {
    // Don't load if one is already loading/loaded or ad is showing
    if (this.appOpenAd !== null || this.isShowingAd) {
      console.log('AppOpenAd: Not loading - ad already exists or is showing');
      return;
    }

    console.log('AppOpenAd: Starting to load ad');

    try {
      // Clear any existing timeout
      if (this.loadTimeoutId) {
        clearTimeout(this.loadTimeoutId);
      }

      // Clean up existing resources safely before creating new ones
      this.safeCleanup();

      // Create the ad with detailed error handling
      this.appOpenAd = AppOpenAd.createForAdRequest(getAdUnitId('appOpen'), {
        requestNonPersonalizedAdsOnly: true,
      });

      console.log(
        'AppOpenAd: Created ad request with ID:',
        getAdUnitId('appOpen')
      );

      // Set up listeners
      this.loadedListener = this.appOpenAd.addAdEventListener(
        AdEventType.LOADED,
        () => {
          console.log('AppOpenAd: Ad loaded successfully');
          this.isLoaded = true;
        }
      );

      this.closedListener = this.appOpenAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log('AppOpenAd: Ad closed');
          this.safeCleanup();

          // Load a new ad for next time with delay
          this.loadTimeoutId = setTimeout(() => this.loadAd(), 5000);
        }
      );

      this.errorListener = this.appOpenAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.log('AppOpenAd: Error loading ad:', error);
          this.safeCleanup();

          // Try again after a delay
          this.loadTimeoutId = setTimeout(() => this.loadAd(), 60000);
        }
      );

      // Load the ad with timeout check
      this.appOpenAd.load();
      console.log('AppOpenAd: Load command sent');
    } catch (error) {
      console.error('AppOpenAd: Critical error loading ad:', error);
      this.safeCleanup();

      // Try again after a delay
      this.loadTimeoutId = setTimeout(() => this.loadAd(), 60000);
    }
  }

  /**
   * Check if an ad can be shown
   */
  canShowAd(isPremium) {
    if (this.isShowingAd) {
      console.log('AppOpenAd: Cannot show - ad is already showing');
      return false;
    }

    // Don't show ads to premium users
    if (isPremium) {
      console.log('AppOpenAd: Cannot show - premium user');
      return false;
    }

    // Must have a loaded ad
    if (!this.isLoaded || this.appOpenAd === null) {
      console.log('AppOpenAd: Cannot show - ad not loaded');
      return false;
    }

    // Check minimum time interval between ads
    const now = Date.now();
    const timeSinceLastAd = now - this.lastShowTime;
    if (timeSinceLastAd < this.MIN_INTERVAL) {
      console.log(
        `AppOpenAd: Cannot show - shown too recently (${Math.round(
          timeSinceLastAd / 1000
        )}s ago)`
      );
      return false;
    }

    console.log('AppOpenAd: Can show ad');
    return true;
  }

  /**
   * Show the app open ad if conditions are met
   * @returns {boolean} True if ad was shown
   */
  showAdIfAvailable(isPremium) {
    if (!this.canShowAd(isPremium)) {
      return false;
    }

    try {
      console.log('AppOpenAd: Showing ad now');
      this.isShowingAd = true;
      this.appOpenAd.show();
      return true;
    } catch (error) {
      console.error('AppOpenAd: Error showing ad:', error);
      this.isShowingAd = false;
      return false;
    }
  }

  /**
   * Reset the manager state (useful for logout)
   */
  reset() {
    console.log('AppOpenAd: Resetting manager state');

    if (this.loadTimeoutId) {
      clearTimeout(this.loadTimeoutId);
      this.loadTimeoutId = null;
    }

    this.safeCleanup();
    this.lastShowTime = 0;
  }
}

// Create and export singleton instance
export default new AppOpenAdManager();

