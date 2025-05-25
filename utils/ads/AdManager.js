import { Platform } from 'react-native';
import {
  InterstitialAd,
  AppOpenAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { getAdUnitId } from './adUnitIds';

/**
 * Global singleton ad manager that safely handles ad lifecycle
 */
class AdManager {
  constructor() {
    // Flag to track initialization
    this.initialized = false;

    // Interstitial ad state
    this.interstitialAd = null;
    this.interstitialLoaded = false;
    this.interstitialListeners = [];
    this.lastAdShowTime = 0;
    this.navigationCounter = 0;

    // App open ad state
    this.appOpenAd = null;
    this.appOpenLoaded = false;
    this.appOpenListeners = [];

    // Constants
    this.AD_SHOW_INTERVAL = 2.5 * 60 * 1000;
    this.NAV_THRESHOLD = 5;

    // Add authentication tracking
    this.isUserLoggedIn = false;

    // Add throttling properties
    this.lastInterstitialLoadTime = 0;
    this.lastAppOpenLoadTime = 0;
    this.MIN_LOAD_INTERVAL = 30 * 1000; // 30 seconds between load attempts
    this.isLoadingInterstitial = false;
    this.isLoadingAppOpen = false;

    // Add global ad timing coordination with separate tracking
    this.lastAnyAdShownTime = 0;
    this.MIN_AD_SEQUENCE_INTERVAL = 90000; // Increase to 5 minutes
    this.adDisplayInProgress = false; // Add this flag to block concurrent ads

    // Track different ad types separately
    this.lastAppOpenAdShownTime = 0;
    this.lastInterstitialAdShownTime = 0;
  }

  /**
   * Initialize the ad manager - can be called multiple times safely
   */
  initialize(forceInit = false) {
    // Don't initialize if user is not logged in
    if (!this.isUserLoggedIn && !forceInit) {
      console.log('AdManager: Not initializing - user not logged in');
      return false;
    }

    console.log('AdManager: Initializing');
    this.initialized = true;

    // Use coordinated loading instead of loading both ad types immediately
    this.coordinateAdLoading();

    return true;
  }

  /**
   * Safely remove all listeners from an ad object
   */
  safeRemoveListeners(listeners) {
    if (!listeners || !Array.isArray(listeners)) return;

    listeners.forEach((listener) => {
      try {
        if (listener && typeof listener === 'function') {
          listener();
        }
      } catch (e) {
        console.log('AdManager: Error removing listener:', e);
      }
    });
  }

  /**
   * Track when any ad is shown - improved implementation
   * @param {string} adType - The type of ad that was shown
   */
  trackAdShown(adType = 'generic') {
    const now = Date.now();
    this.lastAnyAdShownTime = now;
    this.lastAdShowTime = now;

    // Track by specific ad type
    if (adType === 'app_open') {
      this.lastAppOpenAdShownTime = now;
    } else if (adType === 'interstitial') {
      this.lastInterstitialAdShownTime = now;
    }

    console.log(
      `AdManager: ${adType} ad shown, cooldown period started (${
        this.MIN_AD_SEQUENCE_INTERVAL / 1000
      }s)`
    );
  }

  /**
   * Check if enough time has passed since last ad of any type
   */
  canShowAd() {
    // If any ad is currently in progress, block other ads
    if (this.adDisplayInProgress) {
      console.log('AdManager: Ad display in progress, blocking other ads');
      return false;
    }

    const now = Date.now();
    const timeSinceAnyAd = now - this.lastAnyAdShownTime;
    const canShow = timeSinceAnyAd >= this.MIN_AD_SEQUENCE_INTERVAL;

    if (!canShow) {
      console.log(
        `AdManager: Ad cooldown active for ${Math.round(
          (this.MIN_AD_SEQUENCE_INTERVAL - timeSinceAnyAd) / 1000
        )}s more`
      );
    }

    return canShow;
  }

  /**
   * Load an interstitial ad with throttling
   */
  loadInterstitialAd() {
    // Don't load ads if user is not logged in
    if (!this.isUserLoggedIn) {
      console.log('AdManager: Not loading interstitial - user not logged in');
      return;
    }

    // Prevent loading if we're already loading
    if (this.isLoadingInterstitial) {
      console.log('AdManager: Already loading an interstitial ad');
      return;
    }

    // Check if we already have a loaded ad
    if (this.interstitialAd && this.interstitialLoaded) {
      console.log('AdManager: Interstitial already loaded, skipping');
      return;
    }

    // IMPORTANT: Remove the cooldown check for loading ads
    // We should always attempt to have an ad ready even during cooldown

    // Set loading state
    this.isLoadingInterstitial = true;
    this.lastInterstitialLoadTime = Date.now();

    try {
      // Clean up any existing ad
      this.cleanupInterstitialAd();

      console.log('AdManager: Loading interstitial ad');
      const adId = getAdUnitId('interstitial');
      console.log('AdManager: Using interstitial ID:', adId);

      // Create the ad instance
      this.interstitialAd = InterstitialAd.createForAdRequest(adId, {
        requestNonPersonalizedAdsOnly: true,
        keywords: ['inspiration', 'quotes', 'motivation'],
      });

      // Set up event listeners
      const loadedListener = this.interstitialAd.addAdEventListener(
        AdEventType.LOADED,
        () => {
          console.log('AdManager: Interstitial ad loaded');
          this.interstitialLoaded = true;
          this.isLoadingInterstitial = false;
        }
      );

      // THIS IS THE CRITICAL HANDLER - Update cooldown when ad closes
      const closedListener = this.interstitialAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log('AdManager: Interstitial ad closed');
          this.navigationCounter = 0;
          this.interstitialLoaded = false;

          // Set flag to allow other ads again
          this.adDisplayInProgress = false;

          // Track this specific ad type
          this.trackAdShown('interstitial');

          // Load a new ad, but with longer delay
          setTimeout(() => {
            if (this.canShowAd()) {
              this.loadInterstitialAd();
            } else {
              console.log(
                'AdManager: Not loading next interstitial yet - in cooldown period'
              );
            }
          }, 10000);
        }
      );

      const errorListener = this.interstitialAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.log('AdManager: Interstitial ad error:', error);
          this.interstitialLoaded = false;
          this.isLoadingInterstitial = false;

          // Try loading again after delay
          setTimeout(() => this.loadInterstitialAd(), 60000);
        }
      );

      // Store listeners for cleanup
      this.interstitialListeners = [
        loadedListener,
        closedListener,
        errorListener,
      ];

      // Load the ad
      this.interstitialAd.load();
    } catch (error) {
      console.log('AdManager: Error setting up interstitial ad:', error);
      this.interstitialAd = null;
      this.isLoadingInterstitial = false;
    }
  }

  /**
   * Clean up interstitial ad resources
   */
  cleanupInterstitialAd() {
    try {
      this.safeRemoveListeners(this.interstitialListeners);
      this.interstitialListeners = [];
      this.interstitialLoaded = false;
      this.interstitialAd = null;
    } catch (error) {
      console.log('AdManager: Error cleaning up interstitial ad:', error);
    }
  }

  /**
   * Load an app open ad with throttling
   */
  loadAppOpenAd() {
    // Don't load ads if user is not logged in
    if (!this.isUserLoggedIn) {
      console.log('AdManager: Not loading app open ad - user not logged in');
      return;
    }

    // Prevent loading if we're already loading
    if (this.isLoadingAppOpen) {
      console.log('AdManager: Already loading an app open ad');
      return;
    }

    // Check if we already have a loaded ad
    if (this.appOpenAd && this.appOpenLoaded) {
      console.log('AdManager: App open ad already loaded, skipping');
      return;
    }

    // Check throttling time
    const now = Date.now();
    const timeSinceLastLoad = now - this.lastAppOpenLoadTime;
    if (timeSinceLastLoad < this.MIN_LOAD_INTERVAL) {
      console.log(
        `AdManager: Throttling app open load (${Math.round(
          timeSinceLastLoad / 1000
        )}s < ${this.MIN_LOAD_INTERVAL / 1000}s)`
      );
      return;
    }

    // Don't load app open ads if one was shown recently
    if (!this.canShowAd()) {
      console.log('AdManager: Not loading app open ad - in cooldown period');
      return;
    }

    // Set loading state
    this.isLoadingAppOpen = true;
    this.lastAppOpenLoadTime = now;

    try {
      // Clean up any existing ad
      this.cleanupAppOpenAd();

      console.log('AdManager: Loading app open ad');
      const adId = getAdUnitId('appOpen');
      console.log('AdManager: Using app open ID:', adId);

      this.appOpenAd = AppOpenAd.createForAdRequest(adId, {
        requestNonPersonalizedAdsOnly: true,
      });

      // Set up event listeners
      const loadedListener = this.appOpenAd.addAdEventListener(
        AdEventType.LOADED,
        () => {
          console.log('AdManager: App open ad loaded');
          this.appOpenLoaded = true;
          this.isLoadingAppOpen = false;
        }
      );

      // THIS IS THE CRITICAL HANDLER - Update cooldown when ad closes
      const closedListener = this.appOpenAd.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log('AdManager: App open ad closed');
          this.appOpenLoaded = false;

          // Set flag to allow other ads again
          this.adDisplayInProgress = false;

          // Track this specific ad type
          this.trackAdShown('app_open');

          // Load a new ad with longer delay
          setTimeout(() => {
            if (this.canShowAd()) {
              this.loadAppOpenAd();
            } else {
              console.log(
                'AdManager: Not loading next app open ad yet - in cooldown period'
              );
            }
          }, 10000);
        }
      );

      const errorListener = this.appOpenAd.addAdEventListener(
        AdEventType.ERROR,
        (error) => {
          console.log('AdManager: App open ad error:', error);
          this.appOpenLoaded = false;
          this.isLoadingAppOpen = false;

          // Try loading again after delay
          setTimeout(() => this.loadAppOpenAd(), 60000);
        }
      );

      // Store listeners for cleanup
      this.appOpenListeners = [loadedListener, closedListener, errorListener];

      // Load the ad
      this.appOpenAd.load();
    } catch (error) {
      console.log('AdManager: Error setting up app open ad:', error);
      this.appOpenAd = null;
      this.isLoadingAppOpen = false;
    }
  }

  /**
   * Clean up app open ad resources
   */
  cleanupAppOpenAd() {
    try {
      this.safeRemoveListeners(this.appOpenListeners);
      this.appOpenListeners = [];
      this.appOpenLoaded = false;
      this.appOpenAd = null;
    } catch (error) {
      console.log('AdManager: Error cleaning up app open ad:', error);
    }
  }

  /**
   * Update authentication state
   * @param {boolean} isLoggedIn - Whether user is logged in
   */
  setAuthState(isLoggedIn) {
    console.log(
      `AdManager: Setting auth state to ${
        isLoggedIn ? 'logged in' : 'logged out'
      }`
    );
    this.isUserLoggedIn = isLoggedIn;

    if (!isLoggedIn) {
      // User logged out - clean up ads
      this.reset();
    }
  }

  /**
   * Track navigation and show interstitial ad if conditions are met
   */
  trackNavigation(isPremium, from, to) {
    // Don't show ads if user is premium or not logged in
    if (isPremium || !this.isUserLoggedIn) return false;

    // Check if any ad was shown recently
    const now = Date.now();
    const timeSinceAnyAd = now - this.lastAnyAdShownTime;
    const timeSinceLastAd = now - this.lastAdShowTime;

    // Increment counter
    this.navigationCounter++;

    // Add additional debug info for why ad isn't showing
    console.log(
      `AdManager: Navigation #${this.navigationCounter} from ${from} to ${to}`
    );

    // Check if the ad is ready or if we should try loading one
    if (!this.interstitialLoaded || !this.interstitialAd) {
      console.log(
        'AdManager: No interstitial ad ready - attempting to load one'
      );
      this.loadInterstitialAd();
      return false;
    }

    // Log cooldown status
    if (timeSinceAnyAd < this.MIN_AD_SEQUENCE_INTERVAL) {
      console.log(
        `AdManager: Not showing ad - in cooldown for ${Math.round(
          (this.MIN_AD_SEQUENCE_INTERVAL - timeSinceAnyAd) / 1000
        )}s more`
      );
      return false;
    }

    // Check time since last ad
    if (timeSinceLastAd < this.AD_SHOW_INTERVAL) {
      console.log(
        `AdManager: Not showing ad - waiting for interval (${Math.round(
          (this.AD_SHOW_INTERVAL - timeSinceLastAd) / 1000
        )}s more)`
      );
      return false;
    }

    // Check navigation threshold
    if (this.navigationCounter < this.NAV_THRESHOLD) {
      console.log(
        `AdManager: Not showing ad - navigation count ${this.navigationCounter} < threshold ${this.NAV_THRESHOLD}`
      );
      return false;
    }

    // Force ad preload if counter gets very high
    if (this.navigationCounter > 10 && !this.interstitialLoaded) {
      console.log('AdManager: Navigation count very high - forcing ad preload');
      this.loadInterstitialAd();
      return false;
    }

    // All conditions met, show the ad
    try {
      console.log('AdManager: All conditions met, showing interstitial ad');
      this.adDisplayInProgress = true;
      this.interstitialAd.show();
      this.navigationCounter = 0;
      return true;
    } catch (error) {
      console.log('AdManager: Error showing interstitial ad:', error);
      this.adDisplayInProgress = false;

      // Reset the counter if we fail to show ad at a high count
      if (this.navigationCounter > 15) {
        console.log('AdManager: Resetting navigation counter due to error');
        this.navigationCounter = 0;
      }
      return false;
    }
  }

  /**
   * Add flag to prevent concurrent ads when showing app open ad
   */
  showAppOpenAd(isPremium) {
    // Don't show ads if user is premium, not logged in, or in cooldown
    if (isPremium || !this.isUserLoggedIn || !this.canShowAd()) {
      return false;
    }

    if (this.appOpenLoaded && this.appOpenAd) {
      try {
        console.log('AdManager: Showing app open ad');

        // Set flag to block other ads
        this.adDisplayInProgress = true;

        this.appOpenAd.show();
        return true;
      } catch (error) {
        console.log('AdManager: Error showing app open ad:', error);
        this.adDisplayInProgress = false; // Reset flag on error
        return false;
      }
    }

    return false;
  }

  /**
   * Update the forcibly for support ads
   */
  updateLastAdShownTime() {
    this.lastAnyAdShownTime = Date.now();
    console.log('AdManager: Manually updated ad cooldown for support ad');
  }

  /**
   * Reset ad state (for logout, etc.)
   */
  reset() {
    console.log('AdManager: Resetting ad state');
    this.cleanupInterstitialAd();
    this.cleanupAppOpenAd();
    this.lastAdShowTime = 0;
    this.navigationCounter = 0;
  }

  /**
   * Add a method to coordinate ad loading
   */
  coordinateAdLoading() {
    // Only allow one type of ad to be loading at a time
    const now = Date.now();

    // If navigation count is high, prioritize loading interstitial
    if (
      this.navigationCounter >= this.NAV_THRESHOLD &&
      !this.interstitialLoaded
    ) {
      console.log(
        'AdManager: High navigation count - prioritizing interstitial ad load'
      );
      this.loadInterstitialAd();
      return;
    }

    // If no ads are currently loading or showing, load one type
    if (
      !this.isLoadingInterstitial &&
      !this.isLoadingAppOpen &&
      !this.interstitialLoaded &&
      !this.appOpenLoaded
    ) {
      // Prioritize loading interstitial ads
      if (now - this.lastInterstitialLoadTime > this.MIN_LOAD_INTERVAL) {
        console.log('AdManager: Coordinated loading of interstitial ad');
        this.loadInterstitialAd();
      }
      // Only load app open if not loading interstitial
      else if (now - this.lastAppOpenLoadTime > this.MIN_LOAD_INTERVAL) {
        console.log('AdManager: Coordinated loading of app open ad');
        this.loadAppOpenAd();
      }
    }
  }
}

// Export a singleton instance
export default new AdManager();

