import * as FileSystem from 'expo-file-system';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseconfig';

const metadataPath = `${FileSystem.documentDirectory}backgrounds-metadata.json`;

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
    console.log(`Image ${imageName} downloaded successfully.`);
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
    console.log('Local metadata updated successfully.');
  } catch (error) {
    console.error('Error writing local metadata:', error);
  }
};

/**
 * Fetches and caches background images from Firebase Storage.
 * Only downloads images that have been updated since the last check.
 * @param {boolean} isPremiumUser - Whether the user is a premium user.
 * @returns {Promise<Array>} - A list of background objects with local URIs.
 */
export const fetchAndCacheBackgrounds = async (isPremiumUser) => {
  try {
    // Read local metadata
    const localMetadata = await readLocalMetadata();
    console.log('Local metadata:', localMetadata);

    // Fetch remote manifest
    const manifest = await fetchManifest();
    console.log('Remote manifest:', manifest);

    if (!manifest) {
      console.error('Manifest is undefined');
      return [];
    }

    // Ensure backgrounds property exists
    if (!manifest.backgrounds) {
      console.error('Manifest has no backgrounds property');
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
      console.error(
        'Backgrounds is neither array nor object:',
        typeof manifest.backgrounds
      );
      return [];
    }

    // Check if manifest has been updated
    const remoteLastUpdated = new Date(manifest.lastUpdated || 0);
    const localLastChecked = localMetadata.lastChecked
      ? new Date(localMetadata.lastChecked)
      : new Date(0);
    const needsUpdate = remoteLastUpdated > localLastChecked;

    console.log(`Remote last updated: ${remoteLastUpdated}`);
    console.log(`Local last checked: ${localLastChecked}`);
    console.log(`Needs update: ${needsUpdate}`);

    // If no update is needed, try to use cached images
    if (!needsUpdate && localMetadata.backgrounds) {
      console.log('No update needed, using cached images');

      const cachedBackgrounds = [];

      // Check each background from the manifest
      for (const bg of backgroundsArray) {
        const name = bg.name || '';
        const type = bg.type || 'free';

        // Skip premium backgrounds for non-premium users
        if (type === 'premium' && !isPremiumUser) continue;

        // Check if this background is cached
        if (
          localMetadata.backgrounds[name] &&
          localMetadata.backgrounds[name].uri
        ) {
          const cachedUri = localMetadata.backgrounds[name].uri;

          // Verify the file still exists
          const fileInfo = await FileSystem.getInfoAsync(cachedUri);

          if (fileInfo.exists) {
            console.log(`Using cached image for ${name}: ${cachedUri}`);
            cachedBackgrounds.push({
              id: name,
              uri: cachedUri,
              type,
            });
            continue; // Skip downloading this image
          } else {
            console.log(`Cached file not found for ${name}, will download`);
          }
        }
      }

      // If we have all the backgrounds we need from cache, return them
      if (cachedBackgrounds.length > 0) {
        console.log(`Returning ${cachedBackgrounds.length} cached backgrounds`);
        return cachedBackgrounds;
      }

      console.log('Some cached images missing, proceeding with download');
    }

    // If we get here, we need to download at least some images
    console.log('Downloading backgrounds...');

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
        console.warn(`Missing path for background ${name}`);
        continue;
      }

      // Skip premium backgrounds for non-premium users
      if (type === 'premium' && !isPremiumUser) continue;

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
          console.log(`Using existing cached image for ${name}`);
          localUri = cachedUri;
        }
      }

      // If not cached or cache is invalid, download the image
      if (!localUri) {
        try {
          console.log(`Downloading image ${name}`);
          const storagePath = path.startsWith('gs://')
            ? path.replace(/^gs:\/\/[^\/]+\//, '')
            : path;

          const backgroundRef = ref(storage, storagePath);
          const downloadURL = await getDownloadURL(backgroundRef);
          localUri = await downloadImage(name, downloadURL);

          if (!localUri) {
            console.error(`Failed to download image ${name}`);
            continue;
          }
        } catch (error) {
          console.error(`Error downloading image ${name}:`, error);
          continue;
        }
      }

      // Add to results
      downloadedBackgrounds.push({
        id: name,
        uri: localUri,
        type,
      });

      // Update metadata
      newMetadata.backgrounds[name] = {
        uri: localUri,
        updatedAt,
        type,
      };
    }

    // Save updated metadata
    await writeLocalMetadata(newMetadata);

    console.log(
      `Successfully processed ${downloadedBackgrounds.length} backgrounds`
    );
    return downloadedBackgrounds;
  } catch (error) {
    console.error('Error in fetchAndCacheBackgrounds:', error);
    return [];
  }
};

