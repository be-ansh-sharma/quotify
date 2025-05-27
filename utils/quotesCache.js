import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_LAST_CLEARED_KEY = 'quotes_cache_last_cleared';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 1 day in milliseconds

/**
 * Gets quotes from the cache for a specific key
 * @param {string} cacheKey - The cache key to retrieve quotes from
 * @returns {Promise<Object|null>} - The cached data object or null if not found
 */
export const getQuotesFromCache = async (cacheKey) => {
  try {
    const cachedData = await AsyncStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);

        // Check if we have a valid cache entry (either array or object with quotes)
        if (Array.isArray(parsedData)) {
          // Legacy format - just an array of quotes
          console.log(
            `Retrieved ${parsedData.length} quotes from cache for key: ${cacheKey}`
          );
          return { quotes: parsedData, hasMore: true };
        } else if (
          parsedData &&
          parsedData.quotes &&
          Array.isArray(parsedData.quotes)
        ) {
          // New format - object with quotes array and pagination info
          console.log(
            `Retrieved ${parsedData.quotes.length} quotes from cache for key: ${cacheKey}`
          );
          return parsedData;
        } else {
          console.warn(
            `Cache data for key ${cacheKey} is invalid. Clearing this cache entry.`
          );
          await AsyncStorage.removeItem(cacheKey);
          return null;
        }
      } catch (parseError) {
        console.error(
          `Error parsing JSON from cache for key ${cacheKey}:`,
          parseError
        );
        // Cache is corrupted, remove it
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
    }

    console.log(`No cache found for key: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error(
      `Error retrieving quotes from cache for key ${cacheKey}:`,
      error
    );
    return null;
  }
};

/**
 * Saves quotes to the cache with a specific key
 * @param {string} cacheKey - The cache key to store quotes under
 * @param {Object|Array} data - The data to cache (array of quotes or object with quotes property)
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const saveQuotesToCache = async (cacheKey, data) => {
  try {
    if (!data) {
      console.warn(
        `Attempted to cache undefined/null data for key: ${cacheKey}`
      );
      return false;
    }

    // First check if we already have identical data in the cache
    const existingData = await AsyncStorage.getItem(cacheKey);

    if (existingData) {
      try {
        const parsedExisting = JSON.parse(existingData);

        // Get quotes array from both existing and new data
        const existingQuotes = Array.isArray(parsedExisting)
          ? parsedExisting
          : parsedExisting.quotes || [];

        const newQuotes = Array.isArray(data) ? data : data.quotes || [];

        // Compare quote IDs (more efficient than full object comparison)
        const existingIds = existingQuotes
          .map((q) => q.id)
          .sort()
          .join(',');
        const newIds = newQuotes
          .map((q) => q.id)
          .sort()
          .join(',');

        if (existingIds === newIds) {
          console.log(
            `✅ Cache already contains same quotes for key: ${cacheKey}. Skipping save.`
          );
          return true; // Already cached with same data
        }
      } catch (e) {
        // If parsing fails, continue with saving
        console.log(
          `Existing cache for ${cacheKey} couldn't be parsed, will overwrite`
        );
      }
    }

    // Handle both array and object formats
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.log(`No quotes to cache for key: ${cacheKey}`);
        return false;
      }

      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      console.log(
        `💾 Saved ${data.length} quotes to cache with key: ${cacheKey}`
      );
      return true;
    } else if (
      typeof data === 'object' &&
      data.quotes &&
      Array.isArray(data.quotes)
    ) {
      if (data.quotes.length === 0) {
        console.log(`No quotes in data object to cache for key: ${cacheKey}`);
        return false;
      }

      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      console.log(
        `💾 Saved ${data.quotes.length} quotes to cache with key: ${cacheKey}`
      );
      return true;
    } else {
      console.warn(
        `Attempted to cache invalid data format for key: ${cacheKey}`
      );
      return false;
    }
  } catch (error) {
    console.error(`Error saving quotes to cache for key ${cacheKey}:`, error);
    return false;
  }
};

/**
 * Clears the quotes cache only if it's stale (older than 1 day)
 */
export const clearQuotesCacheIfStale = async () => {
  try {
    const now = Date.now();
    const lastClearedStr = await AsyncStorage.getItem(CACHE_LAST_CLEARED_KEY);
    const lastCleared = lastClearedStr ? parseInt(lastClearedStr, 10) : 0;

    // Check if cache is stale (older than CACHE_EXPIRY_TIME)
    if (now - lastCleared > CACHE_EXPIRY_TIME) {
      console.log('Quote cache is stale, clearing...');
      await clearAllQuotesCache();
      await AsyncStorage.setItem(CACHE_LAST_CLEARED_KEY, now.toString());
      return true;
    } else {
      console.log('Quote cache is still fresh, not clearing');
      return false;
    }
  } catch (error) {
    console.error('Error checking or clearing stale cache:', error);
    return false;
  }
};

/**
 * Force clears all quote caches regardless of time
 */
export const clearAllQuotesCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const quoteCacheKeys = keys.filter(
      (key) =>
        key.startsWith('quotes_') ||
        key.startsWith('trending_') ||
        key.startsWith('favorites_') ||
        key.startsWith('qotd_')
    );

    if (quoteCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(quoteCacheKeys);
      console.log(`Cleared ${quoteCacheKeys.length} quote cache items`);
    } else {
      console.log('No quote cache items to clear');
    }

    // Update the last cleared timestamp
    const now = Date.now();
    await AsyncStorage.setItem(CACHE_LAST_CLEARED_KEY, now.toString());

    return true;
  } catch (error) {
    console.error('Error clearing quotes cache:', error);
    return false;
  }
};

