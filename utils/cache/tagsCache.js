import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'tags_cache';
const CACHE_METADATA_KEY = 'tags_cache_metadata';
const CACHE_VALIDITY_DAYS = 7;

export const TagsCache = {
  /**
   * Save tags to cache with metadata
   */
  async saveTags(tags) {
    try {
      const cacheData = {
        tags,
        timestamp: new Date().toISOString(),
        page: 1,
      };

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      const metadata = {
        timestamp: cacheData.timestamp,
        count: tags.length,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));

      console.log(`Cached ${tags.length} tags`);
    } catch (error) {
      console.error('Error saving tags cache:', error);
    }
  },

  /**
   * Load tags from cache if valid
   */
  async loadTags() {
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
        console.log('Tags cache expired, clearing...');
        await this.clearCache();
        return null;
      }

      console.log(
        `Loaded ${parsedData.tags.length} tags from cache (${daysDiff.toFixed(
          1
        )} days old)`
      );

      return {
        tags: parsedData.tags,
        isFromCache: true,
      };
    } catch (error) {
      console.error('Error loading tags cache:', error);
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
   * Clear tags cache
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_METADATA_KEY);
      console.log('Tags cache cleared');
    } catch (error) {
      console.error('Error clearing tags cache:', error);
    }
  },
};
