import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseconfig';

const metadataPath = `${FileSystem.documentDirectory}backgrounds-metadata.json`;
const CACHE_DIR = `${FileSystem.documentDirectory}backgrounds/`;
const CACHE_METADATA_KEY = 'background_cache_metadata';

// Ensure cache directory exists
const ensureCacheDir = async () => {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
};

/**
 * Initialize cache system and return existing metadata
 * @returns {Promise<Object>} Cache metadata object
 */
export const initializeCache = async () => {
  try {
    // Ensure cache directory exists
    await ensureCacheDir();

    // Try to read existing cache metadata
    const metadataJson = await AsyncStorage.getItem(CACHE_METADATA_KEY);

    if (metadataJson) {
      const metadata = JSON.parse(metadataJson);
      return metadata;
    } else {
      return {};
    }
  } catch (error) {
    console.error('Error initializing cache:', error);
    return {};
  }
};

/**
 * Fetches only the background manifest (no image downloads) and handles cache invalidation
 * @param {Function} updateProgress - Progress callback function
 * @param {Object} currentMetadata - Current cache metadata for invalidation check
 * @returns {Promise<Object>} Manifest data and updated cache metadata
 */
export const fetchBackgroundManifest = async (
  updateProgress,
  currentMetadata = {}
) => {
  try {
    updateProgress?.({
      manifest: { loading: true, progress: 0 },
      message: 'Loading backgrounds list...',
    });

    const manifestRef = ref(storage, 'bg/manifest.json');
    const manifestUrl = await getDownloadURL(manifestRef);

    updateProgress?.({
      manifest: { loading: true, progress: 50 },
      message: 'Downloading manifest...',
    });

    const response = await fetch(manifestUrl);
    const manifestData = await response.json();

    updateProgress?.({
      manifest: { loading: true, progress: 75 },
      message: 'Checking for updates...',
    });

    // Check for manifest updates and invalidate cache if needed
    const updatedMetadata = await checkManifestAndInvalidateCache(
      manifestData,
      currentMetadata
    );

    updateProgress?.({
      manifest: { loading: false, progress: 100 },
      message: 'Manifest loaded successfully',
    });

    return {
      manifestData,
      updatedMetadata, // Return updated metadata after cache invalidation
    };
  } catch (error) {
    console.error('Error fetching background manifest:', error);

    updateProgress?.({
      manifest: { loading: false, progress: 0 },
      message: 'Failed to load manifest',
    });

    throw error;
  }
};

/**
 * Load a single background image with caching
 * @param {Object} params - Parameters object
 * @param {string} params.path - Firebase storage path
 * @param {string} params.id - Background ID
 * @param {string} params.updatedAt - Last updated timestamp
 * @param {boolean} params.forceReload - Force download even if cached
 * @param {Object} params.cacheMetadata - Current cache metadata
 * @param {Function} params.updateProgress - Progress callback
 * @returns {Promise<Object>} Result with imageUrl and updated metadata
 */
export const loadBackgroundImage = async ({
  path,
  id,
  updatedAt,
  forceReload = false,
  cacheMetadata = {},
  updateProgress,
}) => {
  // Ensure cacheMetadata is always an object
  cacheMetadata = cacheMetadata || {};

  updateProgress?.({
    downloads: {
      [id]: { progress: 0, status: 'starting' },
    },
    message: `Loading ${id}...`,
  });

  try {
    let imageUrl;
    const cachePath = `${CACHE_DIR}${id}`;

    // Check if we should use cache
    const shouldUseCache =
      !forceReload && (await isImageCached(id, cacheMetadata, updatedAt));

    console.log(`Should use cache for ${id}: ${shouldUseCache}`);
    if (shouldUseCache) {
      imageUrl = cachePath;

      // Update progress immediately for cached files
      updateProgress?.({
        completedFiles: 1,
        downloads: {
          [id]: { progress: 100, status: 'complete' },
        },
        message: `Loaded ${id} from cache`,
      });

      return {
        imageUrl,
        id,
        cacheMetadata,
      };
    }

    let downloadUrl;

    if (path.startsWith('gs://')) {
      // Extract path from the gs:// URL
      const gsPathRegex = /^gs:\/\/([^\/]+)\/(.*)$/;
      const match = path.match(gsPathRegex);

      if (!match) {
        throw new Error(`Invalid gs:// path format: ${path}`);
      }

      const filePath = match[2];
      const storageRef = ref(storage, filePath);
      downloadUrl = await getDownloadURL(storageRef);
    } else {
      // Direct URL
      downloadUrl = path;
    }

    // Download with progress tracking
    const downloadResumable = FileSystem.createDownloadResumable(
      downloadUrl,
      cachePath,
      {},
      (downloadProgress) => {
        const progress =
          downloadProgress.totalBytesWritten /
          downloadProgress.totalBytesExpectedToWrite;

        // Update progress state (but not too frequently)
        if (progress === 1 || Math.random() < 0.1) {
          updateProgress?.({
            downloads: {
              [id]: {
                progress: Math.round(progress * 100),
                status: 'downloading',
              },
            },
            message: `Downloading ${id}: ${Math.round(progress * 100)}%`,
          });
        }
      }
    );

    const { uri } = await downloadResumable.downloadAsync();

    if (uri) {
      imageUrl = uri;

      // Create updated metadata with the new image
      const newMetadata = {
        ...(cacheMetadata || {}),
        [id]: {
          updatedAt: updatedAt || new Date().toISOString(),
          cachedAt: new Date().toISOString(),
          path: cachePath,
        },
      };

      // Save updated cache metadata to AsyncStorage
      try {
        await AsyncStorage.setItem(
          CACHE_METADATA_KEY,
          JSON.stringify(newMetadata)
        );
      } catch (metadataError) {
        console.error(`Error saving metadata for ${id}:`, metadataError);
        // Don't fail the whole operation if metadata save fails
      }

      // Update progress with completion
      updateProgress?.({
        completedFiles: 1,
        downloads: {
          [id]: { progress: 100, status: 'complete' },
        },
        message: `Downloaded and cached ${id}`,
      });

      // Return updated cache metadata
      return {
        imageUrl,
        id,
        cacheMetadata: newMetadata,
      };
    }

    throw new Error(`Failed to load image for ${id}`);
  } catch (error) {
    console.error(`Error loading background ${id}:`, error);

    // Update progress with error
    updateProgress?.({
      downloads: {
        [id]: { progress: 0, status: 'error', error: error.message },
      },
      message: `Error loading ${id}: ${error.message}`,
    });

    throw error;
  }
};

/**
 * Downloads an image from a remote URL and saves it locally.
 * @param {string} imageName - The name of the image.
 * @param {string} imageUrl - The URL of the image.
 * @returns {string|null} - The local path of the downloaded image or null if the download fails.
 */
const downloadImage = async (imageName, imageUrl) => {
  const localPath = `${FileSystem.documentDirectory}${imageName}`;

  try {
    const downloadResult = await FileSystem.downloadAsync(imageUrl, localPath);
    return downloadResult.uri;
  } catch (error) {
    console.error(`Error downloading image ${imageName}:`, error);
    return null;
  }
};

/**
 * Fetches the combined manifest.json file from Firebase Storage.
 * @returns {Promise<Object|null>} - The parsed manifest.json or null if an error occurs.
 */
const fetchManifest = async () => {
  try {
    const manifestRef = ref(storage, `bg/manifest.json`);
    const manifestUrl = await getDownloadURL(manifestRef);
    const response = await fetch(manifestUrl);
    const manifest = await response.json();
    return manifest;
  } catch (error) {
    console.error(`Error fetching manifest:`, error);
    return null;
  }
};

/**
 * Reads the local metadata file.
 * @returns {Promise<Object>} - The parsed metadata or an empty object if the file doesn't exist.
 */
const readLocalMetadata = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(metadataPath);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(metadataPath);
      return JSON.parse(content);
    }
    return { lastChecked: null, backgrounds: {} };
  } catch (error) {
    console.error('Error reading local metadata:', error);
    return { lastChecked: null, backgrounds: {} };
  }
};

/**
 * Writes the local metadata file.
 * @param {Object} metadata - The metadata to write.
 * @returns {Promise<void>}
 */
const writeLocalMetadata = async (metadata) => {
  try {
    await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata));
  } catch (error) {
    console.error('Error writing local metadata:', error);
  }
};

/**
 * Fetches and caches background images from Firebase Storage.
 * Downloads both free and premium images, regardless of user status.
 * @param {boolean} isPremiumUser - Whether the user is a premium user (for return filtering only).
 * @returns {Promise<Array>} - A list of background objects with local URIs.
 */
export const fetchAndCacheBackgrounds = async (isPremiumUser) => {
  try {
    // Read local metadata
    const localMetadata = await readLocalMetadata();

    // Fetch remote manifest
    const manifest = await fetchManifest();

    if (!manifest) {
      return [];
    }

    // Ensure backgrounds property exists
    if (!manifest.backgrounds) {
      return [];
    }

    // Handle both array and object formats for backgrounds
    let backgroundsArray = [];
    if (Array.isArray(manifest.backgrounds)) {
      backgroundsArray = manifest.backgrounds;
    } else if (typeof manifest.backgrounds === 'object') {
      backgroundsArray = Object.entries(manifest.backgrounds).map(
        ([key, value]) => ({
          name: key,
          ...value,
        })
      );
    } else {
      return [];
    }

    // Check if manifest has been updated
    const remoteLastUpdated = new Date(manifest.lastUpdated || 0);
    const localLastChecked = localMetadata.lastChecked
      ? new Date(localMetadata.lastChecked)
      : new Date(0);
    const needsUpdate = remoteLastUpdated > localLastChecked;

    // If no update is needed, try to use cached images
    if (!needsUpdate && localMetadata.backgrounds) {
      const cachedBackgrounds = [];

      // Check each background from the manifest
      for (const bg of backgroundsArray) {
        const name = bg.name || '';
        const type = bg.type || 'free';

        // Check if this background is cached
        if (
          localMetadata.backgrounds[name] &&
          localMetadata.backgrounds[name].uri
        ) {
          const cachedUri = localMetadata.backgrounds[name].uri;

          // Verify the file still exists
          const fileInfo = await FileSystem.getInfoAsync(cachedUri);

          if (fileInfo.exists) {
            cachedBackgrounds.push({
              id: name,
              uri: cachedUri,
              type,
            });
            continue; // Skip downloading this image
          }
        }
      }

      // If we have all the backgrounds we need from cache, return them
      if (cachedBackgrounds.length > 0) {
        return cachedBackgrounds;
      }
    }

    // If we get here, we need to download at least some images
    const downloadedBackgrounds = [];
    const newMetadata = {
      lastChecked: new Date().toISOString(),
      backgrounds: {},
    };

    for (const bg of backgroundsArray) {
      const name = bg.name || `bg_${Math.random().toString(36).substr(2, 9)}`;
      const path = bg.path;
      const type = bg.type || 'free';
      const updatedAt = bg.updatedAt || new Date().toISOString();

      if (!path) {
        continue;
      }

      let localUri = null;

      // First check if we already have this image cached and it hasn't changed
      if (
        localMetadata.backgrounds &&
        localMetadata.backgrounds[name] &&
        localMetadata.backgrounds[name].uri &&
        localMetadata.backgrounds[name].updatedAt === updatedAt
      ) {
        const cachedUri = localMetadata.backgrounds[name].uri;
        const fileInfo = await FileSystem.getInfoAsync(cachedUri);

        if (fileInfo.exists) {
          localUri = cachedUri;
        }
      }

      // If not cached or cache is invalid, download the image
      if (!localUri) {
        try {
          const storagePath = path.startsWith('gs://')
            ? path.replace(/^gs:\/\/[^\/]+\//, '')
            : path;

          const backgroundRef = ref(storage, storagePath);
          const downloadURL = await getDownloadURL(backgroundRef);
          localUri = await downloadImage(name, downloadURL);

          if (!localUri) {
            continue;
          }
        } catch (error) {
          console.error(`Error downloading image ${name}:`, error);
          continue;
        }
      }

      // Add to results - but only if it's a free background or the user has premium
      if (type !== 'premium' || isPremiumUser) {
        downloadedBackgrounds.push({
          id: name,
          uri: localUri,
          type,
        });
      }

      // Always update metadata for all backgrounds (premium and free)
      newMetadata.backgrounds[name] = {
        uri: localUri,
        updatedAt,
        type,
      };
    }

    // Save updated metadata
    await writeLocalMetadata(newMetadata);

    return downloadedBackgrounds;
  } catch (error) {
    console.error('Error in fetchAndCacheBackgrounds:', error);
    return [];
  }
};

/**
 * Check if an image is cached
 * @param {string} id - Background ID
 * @param {Object} cacheMetadata - Current cache metadata
 * @param {string} updatedAt - Expected update timestamp
 * @returns {Promise<boolean>} Whether the image is properly cached
 */
export const isImageCached = async (id, cacheMetadata = {}, updatedAt) => {
  try {
    const cachePath = `${CACHE_DIR}${id}`;

    // Check metadata
    if (!cacheMetadata[id]) {
      return false;
    }

    // Check timestamp if provided
    if (updatedAt && cacheMetadata[id].updatedAt !== updatedAt) {
      return false;
    }

    // Check file exists
    const fileInfo = await FileSystem.getInfoAsync(cachePath);
    if (!fileInfo.exists || fileInfo.size === 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error checking cache for ${id}:`, error);
    return false;
  }
};

/**
 * Clear all cached background images and metadata
 * @returns {Promise<void>}
 */
export const clearAllCache = async () => {
  try {
    // Remove all files from cache directory
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      const files = await FileSystem.readDirectoryAsync(CACHE_DIR);

      for (const file of files) {
        const filePath = `${CACHE_DIR}${file}`;
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
    }

    // Clear metadata from AsyncStorage
    await AsyncStorage.removeItem(CACHE_METADATA_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Remove a specific cached image
 * @param {string} id - Background ID to remove
 * @param {Object} currentMetadata - Current cache metadata
 * @returns {Promise<Object>} Updated metadata without the removed image
 */
export const removeCachedImage = async (id, currentMetadata = {}) => {
  try {
    const cachePath = `${CACHE_DIR}${id}`;

    // Remove the file
    const fileInfo = await FileSystem.getInfoAsync(cachePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(cachePath, { idempotent: true });
    }

    // Update metadata
    const newMetadata = { ...currentMetadata };
    delete newMetadata[id];

    // Save updated metadata
    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(newMetadata));

    return newMetadata;
  } catch (error) {
    console.error(`Error removing cached image ${id}:`, error);
    return currentMetadata;
  }
};

/**
 * Check if manifest has been updated and handle cache invalidation
 * @param {Object} manifestData - The manifest data from remote
 * @param {Object} currentMetadata - Current cache metadata
 * @returns {Promise<Object>} Updated cache metadata after invalidation
 */
export const checkManifestAndInvalidateCache = async (
  manifestData,
  currentMetadata = {}
) => {
  try {
    if (
      !manifestData ||
      !manifestData.backgrounds ||
      !Array.isArray(manifestData.backgrounds)
    ) {
      return currentMetadata;
    }

    // Check if we have a stored manifest timestamp
    const storedManifestData = await AsyncStorage.getItem('manifest_timestamp');
    const lastManifestUpdate = storedManifestData
      ? JSON.parse(storedManifestData)
      : null;

    const remoteLastUpdated = manifestData.lastUpdated;

    // If manifest has been updated globally, clear all cache
    if (
      lastManifestUpdate &&
      remoteLastUpdated &&
      new Date(remoteLastUpdated) > new Date(lastManifestUpdate.lastUpdated)
    ) {
      await clearAllCache();

      // Save new manifest timestamp
      await AsyncStorage.setItem(
        'manifest_timestamp',
        JSON.stringify({
          lastUpdated: remoteLastUpdated,
          checkedAt: new Date().toISOString(),
        })
      );

      return {}; // Return empty metadata since we cleared everything
    }

    // Check individual images for updates
    let updatedMetadata = { ...currentMetadata };
    let hasChanges = false;

    for (const bg of manifestData.backgrounds) {
      const id = bg.name;
      const remoteUpdatedAt = bg.updatedAt;

      if (currentMetadata[id]) {
        const cachedUpdatedAt = currentMetadata[id].updatedAt;

        // If this specific image has been updated, remove it from cache
        if (
          remoteUpdatedAt &&
          cachedUpdatedAt &&
          new Date(remoteUpdatedAt) > new Date(cachedUpdatedAt)
        ) {
          updatedMetadata = await removeCachedImage(id, updatedMetadata);
          hasChanges = true;
        }
      }
    }

    // Save manifest timestamp if this is the first time or if we haven't stored it
    if (!lastManifestUpdate && remoteLastUpdated) {
      await AsyncStorage.setItem(
        'manifest_timestamp',
        JSON.stringify({
          lastUpdated: remoteLastUpdated,
          checkedAt: new Date().toISOString(),
        })
      );
    }

    return updatedMetadata;
  } catch (error) {
    console.error('Error checking manifest and invalidating cache:', error);
    return currentMetadata;
  }
};

/**
 * Manual function to force clear cache and re-download everything
 * Use this for testing or when user wants to refresh all backgrounds
 * @returns {Promise<void>}
 */
export const forceClearCacheAndRedownload = async () => {
  try {
    // Clear all cached files and metadata
    await clearAllCache();

    // Also clear the manifest timestamp to force a full refresh
    await AsyncStorage.removeItem('manifest_timestamp');
  } catch (error) {
    console.error('Error force-clearing cache:', error);
  }
};

