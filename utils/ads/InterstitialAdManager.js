import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// Production ad unit ID - replace with your actual ID when ready
const INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-2290547364208155~XXXXXXXX';

class InterstitialAdManager {
  constructor() {
    this.adUnitId = __DEV__ ? TestIds.INTERSTITIAL : INTERSTITIAL_AD_UNIT_ID;
    this.interstitialAd = null;
    this.isLoaded = false;
    this.lastShowTime = 0;
    this.MIN_INTERVAL = 6 * 60 * 1000; // 6 minutes between ads
    this.navigationCounter = 0;
    this.NAV_THRESHOLD = 4; // Show ad every 4 navigations (configurable)

    this.loadAd();
  }

  loadAd() {
    this.interstitialAd = InterstitialAd.createForAdRequest(this.adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = this.interstitialAd.addAdEventListener(
      AdEventType.LOADED,
      () => {
        this.isLoaded = true;
        console.log('Interstitial ad loaded and ready');
      }
    );

    const unsubscribeClosed = this.interstitialAd.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        this.isLoaded = false;
        this.lastShowTime = Date.now();
        this.navigationCounter = 0; // Reset counter after showing ad
        this.loadAd(); // Preload next ad
        console.log('Interstitial ad closed, loading next one');
      }
    );

    this.interstitialAd.load();
  }

  canShowAd(isPremium = false) {
    if (isPremium) return false;

    const now = Date.now();
    const timeSinceLastAd = now - this.lastShowTime;

    return this.isLoaded && timeSinceLastAd >= this.MIN_INTERVAL;
  }

  // Track navigation and potentially show ad
  trackNavigation(isPremium = false) {
    this.navigationCounter++;

    // Check if we've hit our navigation threshold
    if (this.navigationCounter >= this.NAV_THRESHOLD) {
      return this.showAd(isPremium);
    }

    return false;
  }

  showAd(isPremium = false) {
    if (!this.canShowAd(isPremium)) return false;

    this.interstitialAd.show();
    return true;
  }
}

// Export a singleton instance
export default new InterstitialAdManager();

