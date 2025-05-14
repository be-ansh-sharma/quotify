import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache expiration - 1 hour by default
const CACHE_EXPIRATION = 60 * 60 * 1000;
const CACHE_PREFIX = 'QUOTES_CACHE_';

export const saveQuotesToCache = async (key, data) => {
  try {
    const fullKey = `${CACHE_PREFIX}${key}`;
    await AsyncStorage.setItem(
      fullKey,
      JSON.stringify({
        ...data,
        timestamp: Date.now(),
      })
    );
    return true;
  } catch (error) {
    console.error('Error saving quotes to cache:', error);
    return false;
  }
};

export const getQuotesFromCache = async (key) => {
  try {
    const fullKey = `${CACHE_PREFIX}${key}`;
    const cachedData = await AsyncStorage.getItem(fullKey);

    if (!cachedData) return null;

    const parsedData = JSON.parse(cachedData);

    // Check if cache is expired
    if (Date.now() - parsedData.timestamp > CACHE_EXPIRATION) {
      console.log(`🕒 Cache expired for key: ${fullKey}`);
      await AsyncStorage.removeItem(fullKey);
      return null;
    }

    return parsedData;
  } catch (error) {
    console.error('Error getting quotes from cache:', error);
    return null;
  }
};

// Clear all quote caches
export const clearAllQuotesCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const quoteKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    if (quoteKeys.length > 0) {
      await AsyncStorage.multiRemove(quoteKeys);
      console.log(`🧹 Cleared ${quoteKeys.length} quote cache entries`);
    }
    return true;
  } catch (error) {
    console.error('Error clearing quotes cache:', error);
    return false;
  }
};

