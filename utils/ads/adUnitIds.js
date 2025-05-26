import { TestIds } from 'react-native-google-mobile-ads';

/**
 * Ad unit IDs for different ad formats
 * Use TestIds in development and real IDs in production
 */
const AdUnitIds = {
  // Banner ads
  banner: {
    test: TestIds.BANNER,
    production: 'ca-app-pub-2290547364208155/5055275696',
  },

  // Interstitial ads
  interstitial: {
    test: TestIds.INTERSTITIAL,
    production: 'ca-app-pub-2290547364208155/7322346383', // Replace with your interstitial ID
  },

  // App open ads
  appOpen: {
    test: TestIds.APP_OPEN,
    production: 'ca-app-pub-2290547364208155/3942097478', // Replace with your app open ID
  },

  // Rewarded ads
  rewarded: {
    test: TestIds.REWARDED,
    production: 'ca-app-pub-2290547364208155/3438941697', // Replace with your ID
  },
};

/**
 * Get the appropriate ad unit ID based on environment
 * @param {string} adType - The type of ad (banner, interstitial, etc.)
 * @returns {string} The ad unit ID
 */
export const getAdUnitId = (adType) => {
  const adConfig = AdUnitIds[adType];

  if (!adConfig) {
    console.warn(
      `Ad type "${adType}" not found in configuration. Falling back to test banner.`
    );
    return TestIds.BANNER;
  }
  return __DEV__ ? adConfig.test : adConfig.production;
};

export default AdUnitIds;

