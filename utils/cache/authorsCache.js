import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'authors_cache';
const CACHE_METADATA_KEY = 'authors_cache_metadata';
const CACHE_VALIDITY_DAYS = 7;

export const AuthorsCache = {
  /**
   * Save authors to cache with metadata
   */
  async saveAuthors(authors, lastDoc = null) {
    try {
      const cacheData = {
        authors,
        lastDoc: lastDoc
          ? {
              id: lastDoc.id,
              // Store minimal data needed to recreate the document reference
              data: lastDoc.data(),
            }
          : null,
        timestamp: new Date().toISOString(),
        page: 1, // Track which page this represents
      };

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      // Save metadata separately for quick access
      const metadata = {
        timestamp: cacheData.timestamp,
        count: authors.length,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));

      console.log(`Cached ${authors.length} authors`);
    } catch (error) {
      console.error('Error saving authors cache:', error);
    }
  },

  /**
   * Load authors from cache if valid
   */
  async loadAuthors() {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_KEY);
      if (!cacheData) {
        return null;
      }

      const parsedData = JSON.parse(cacheData);

      // Check if cache is still valid (7 days)
      const cacheDate = new Date(parsedData.timestamp);
      const now = new Date();
      const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);

      if (daysDiff > CACHE_VALIDITY_DAYS) {
        console.log('Authors cache expired, clearing...');
        await this.clearCache();
        return null;
      }

      console.log(
        `Loaded ${
          parsedData.authors.length
        } authors from cache (${daysDiff.toFixed(1)} days old)`
      );

      return {
        authors: parsedData.authors,
        lastDoc: parsedData.lastDoc,
        isFromCache: true,
      };
    } catch (error) {
      console.error('Error loading authors cache:', error);
      return null;
    }
  },

  /**
   * Check if cache exists and is valid
   */
  async isCacheValid() {
    try {
      const metadata = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (!metadata) {
        return false;
      }

      const parsedMetadata = JSON.parse(metadata);
      const cacheDate = new Date(parsedMetadata.timestamp);
      const now = new Date();
      const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);

      return daysDiff <= CACHE_VALIDITY_DAYS;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  },

  /**
   * Get cache metadata for debugging
   */
  async getCacheInfo() {
    try {
      const metadata = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (!metadata) {
        return null;
      }

      const parsedMetadata = JSON.parse(metadata);
      const cacheDate = new Date(parsedMetadata.timestamp);
      const now = new Date();
      const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);

      return {
        ...parsedMetadata,
        daysOld: daysDiff,
        isValid: daysDiff <= CACHE_VALIDITY_DAYS,
      };
    } catch (error) {
      console.error('Error getting cache info:', error);
      return null;
    }
  },

  /**
   * Clear authors cache
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
      console.log('Authors cache cleared');
    } catch (error) {
      console.error('Error clearing authors cache:', error);
    }
  },
};
