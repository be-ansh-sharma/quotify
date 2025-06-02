import { Platform } from 'react-native';
import {
  InterstitialAd,
  AppOpenAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { getAdUnitId } from './adUnitIds';

/**
 * Simplified Ad Manager - One ad at a time, strict cooldowns
 */
class AdManager {
  constructor() {
    // Basic state
    this.isUserLoggedIn = false;
    this.initialized = false;

    // Simple ad state
    this.interstitialAd = null;
    this.appOpenAd = null;
    this.interstitialLoaded = false;
    this.appOpenLoaded = false;
    this.isLoadingInterstitial = false;
    this.isLoadingAppOpen = false;

    // SIMPLE: One global cooldown for ALL ads
    this.GLOBAL_AD_COOLDOWN = 3 * 60 * 1000; // 3 minutes between ANY ads
    this.lastAdTime = 0;

    // Navigation tracking
    this.navigationCount = 0;
    this.NAV_THRESHOLD = 4; // Show ad every 4 navigations

    // Session limits
    this.sessionAdsShown = 0;
    this.MAX_SESSION_ADS = 6;
    this.sessionStart = Date.now();

    // CRITICAL: Global lock to prevent any overlapping
    this.adInProgress = false;
  }

  /**
   * Set authentication state - MAIN METHOD USED BY LAYOUT
   */
  setAuthState(isLoggedIn) {
    console.log(`🔑 Auth state: ${isLoggedIn ? 'logged in' : 'logged out'}`);

    const wasLoggedIn = this.isUserLoggedIn;
    this.isUserLoggedIn = isLoggedIn;

    if (isLoggedIn && !wasLoggedIn) {
      // User just logged in
      this.initialize();
    } else if (!isLoggedIn) {
      // User logged out or not logged in
      this.reset();
    }
  }

  /**
   * Initialize
   */
  initialize() {
    if (!this.isUserLoggedIn || this.initialized) {
      return;
    }

    console.log('🚀 Initializing AdManager');
    this.initialized = true;
    this.sessionStart = Date.now();
    this.sessionAdsShown = 0;
    this.lastAdTime = 0;
    this.navigationCount = 0;

    // Load ads after delay
    setTimeout(() => this.loadInterstitialAd(), 2000);
    setTimeout(() => this.loadAppOpenAd(), 5000);
  }

  /**
   * Reset
   */
  reset() {
    console.log('🔄 Resetting AdManager');
    this.interstitialAd = null;
    this.appOpenAd = null;
    this.interstitialLoaded = false;
    this.appOpenLoaded = false;
    this.isLoadingInterstitial = false;
    this.isLoadingAppOpen = false;
    this.adInProgress = false;
    this.navigationCount = 0;
    this.sessionAdsShown = 0;
    this.lastAdTime = 0;
    this.initialized = false;
  }

  /**
   * Check if can show any ad
   */
  canShowAnyAd() {
    const now = Date.now();
    const timeSinceLastAd = now - this.lastAdTime;

    if (!this.isUserLoggedIn) return false;
    if (this.adInProgress) return false;
    if (this.sessionAdsShown >= this.MAX_SESSION_ADS) return false;
    if (timeSinceLastAd < this.GLOBAL_AD_COOLDOWN) return false;

    return true;
  }

  /**
   * Mark ad as shown
   */
  markAdShown(adType) {
    console.log(`🎯 AD COMPLETED: ${adType}`);
    this.lastAdTime = Date.now();
    this.sessionAdsShown++;
    this.adInProgress = false;
    this.navigationCount = 0;
  }

  /**
   * Navigation tracking
   */
  onNavigation(isPremium, from, to) {
    if (isPremium || !this.canShowAnyAd()) return false;

    this.navigationCount++;
    console.log(
      `🧭 Navigation ${this.navigationCount}/${this.NAV_THRESHOLD}: ${from} → ${to}`
    );

    if (this.navigationCount >= this.NAV_THRESHOLD && this.interstitialLoaded) {
      return this.showInterstitialAd();
    }

    // Load ad if we don't have one
    if (!this.interstitialLoaded && !this.isLoadingInterstitial) {
      this.loadInterstitialAd();
    }

    return false;
  }

  /**
   * App foreground
   */
  onAppForeground(isPremium) {
    if (isPremium || !this.canShowAnyAd()) return false;

    if (this.appOpenLoaded) {
      return this.showAppOpenAd();
    }

    // Load ad if we don't have one
    if (!this.appOpenLoaded && !this.isLoadingAppOpen) {
      this.loadAppOpenAd();
    }

    return false;
  }

  /**
   * Show interstitial
   */
  showInterstitialAd() {
    if (this.adInProgress || !this.interstitialAd || !this.interstitialLoaded) {
      return false;
    }

    try {
      console.log('📱 SHOWING INTERSTITIAL');
      this.adInProgress = true;
      this.interstitialAd.show();
      return true;
    } catch (error) {
      console.log('Error showing interstitial:', error);
      this.adInProgress = false;
      return false;
    }
  }

  /**
   * Show app open
   */
  showAppOpenAd() {
    if (this.adInProgress || !this.appOpenAd || !this.appOpenLoaded) {
      return false;
    }

    try {
      console.log('🚪 SHOWING APP OPEN');
      this.adInProgress = true;
      this.appOpenAd.show();
      return true;
    } catch (error) {
      console.log('Error showing app open:', error);
      this.adInProgress = false;
      return false;
    }
  }

  /**
   * Load interstitial
   */
  loadInterstitialAd() {
    if (
      !this.isUserLoggedIn ||
      this.interstitialLoaded ||
      this.isLoadingInterstitial
    ) {
      return;
    }

    this.isLoadingInterstitial = true;
    console.log('📱 Loading interstitial...');

    try {
      const adId = getAdUnitId('interstitial');
      this.interstitialAd = InterstitialAd.createForAdRequest(adId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('✅ Interstitial loaded');
        this.interstitialLoaded = true;
        this.isLoadingInterstitial = false;
      });

      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('❌ Interstitial closed');
        this.markAdShown('interstitial');
        this.interstitialLoaded = false;
        setTimeout(() => this.loadInterstitialAd(), 30000);
      });

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('❌ Interstitial error:', error);
        this.isLoadingInterstitial = false;
        this.adInProgress = false;
      });

      this.interstitialAd.load();
    } catch (error) {
      console.log('Error loading interstitial:', error);
      this.isLoadingInterstitial = false;
    }
  }

  /**
   * Load app open
   */
  loadAppOpenAd() {
    if (!this.isUserLoggedIn || this.appOpenLoaded || this.isLoadingAppOpen) {
      return;
    }

    this.isLoadingAppOpen = true;
    console.log('🚪 Loading app open...');

    try {
      const adId = getAdUnitId('appOpen');
      this.appOpenAd = AppOpenAd.createForAdRequest(adId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('✅ App open loaded');
        this.appOpenLoaded = true;
        this.isLoadingAppOpen = false;
      });

      this.appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('❌ App open closed');
        this.markAdShown('app_open');
        this.appOpenLoaded = false;
        setTimeout(() => this.loadAppOpenAd(), 30000);
      });

      this.appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
        console.log('❌ App open error:', error);
        this.isLoadingAppOpen = false;
        this.adInProgress = false;
      });

      this.appOpenAd.load();
    } catch (error) {
      console.log('Error loading app open:', error);
      this.isLoadingAppOpen = false;
    }
  }

  /**
   * Manual ad tracking
   */
  manualAdShown() {
    this.markAdShown('manual');
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      isUserLoggedIn: this.isUserLoggedIn,
      initialized: this.initialized,
      adInProgress: this.adInProgress,
      canShowAd: this.canShowAnyAd(),
    };
  }
}

// Export singleton
export default new AdManager();

