import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  fetchBackgroundManifest,
  loadBackgroundImage as loadBgImage,
  initializeCache,
} from 'utils/firebase/firestorage';

export default function useBackgrounds(isPremiumUser) {
  // Manifest state - loads instantly
  const [backgroundsManifest, setBackgroundsManifest] = useState([]);
  const [manifestLoading, setManifestLoading] = useState(true);
  const [manifestError, setManifestError] = useState(null);

  // Image loading state - loads lazily
  const [loadedBackgrounds, setLoadedBackgrounds] = useState({});
  const [loadingStates, setLoadingStates] = useState({});

  // Use a ref for cache metadata to ensure it's always up-to-date
  const cacheMetadataRef = useRef({});
  const [cacheMetadataState, setCacheMetadataState] = useState({});

  // Current selection
  const [selectedBackground, setSelectedBackground] = useState(null);

  // Progress tracking for downloads
  const [progress, setProgress] = useState({
    manifest: { loading: false, progress: 0 },
    downloads: {},
    totalFiles: 0,
    completedFiles: 0,
    message: '',
  });

  // Use refs to track loading queue and prevent duplicate loads
  const loadingQueueRef = useRef(new Set());
  const lazyLoadTimeoutRef = useRef(null);

  // Update cache metadata helper - updates both ref and state
  const updateCacheMetadata = useCallback((newMetadata) => {
    cacheMetadataRef.current = newMetadata;
    setCacheMetadataState(newMetadata);
  }, []);

  // Update progress helper - memoized to prevent re-renders
  const updateProgress = useCallback((update) => {
    setProgress((prev) => ({
      ...prev,
      ...update,
      downloads: { ...prev.downloads, ...(update.downloads || {}) },
    }));
  }, []);

  // Fetch manifest only (no image downloads)
  const fetchManifest = useCallback(async () => {
    setManifestLoading(true);
    setManifestError(null);

    try {
      // Pass current cache metadata for invalidation check
      const currentMetadata = cacheMetadataRef.current || {};
      const result = await fetchBackgroundManifest(
        updateProgress,
        currentMetadata
      );

      if (result && result.manifestData) {
        // Update cache metadata if it was changed during invalidation
        if (result.updatedMetadata) {
          updateCacheMetadata(result.updatedMetadata);
        }

        processManifest(result.manifestData);
      } else {
        throw new Error('No manifest data returned');
      }
    } catch (error) {
      console.error('useBackgrounds: Error fetching manifest:', error);
      setManifestError('Failed to load backgrounds');

      // Use fallbacks on error
      processManifest({
        lastUpdated: new Date().toISOString(),
        backgrounds: [
          {
            name: 'fallback1.jpg',
            path: 'https://source.unsplash.com/random/1200x800/?nature',
            updatedAt: new Date().toISOString(),
            type: 'free',
          },
          {
            name: 'fallback2.jpg',
            path: 'https://source.unsplash.com/random/1200x800/?abstract',
            updatedAt: new Date().toISOString(),
            type: 'free',
          },
        ],
      });
    } finally {
      setManifestLoading(false);
    }
  }, [updateProgress, updateCacheMetadata]);

  // Process manifest data without downloading images
  const processManifest = useCallback(
    (manifestData) => {
      if (
        !manifestData ||
        !manifestData.backgrounds ||
        !Array.isArray(manifestData.backgrounds)
      ) {
        console.error('Invalid manifest data');
        setManifestLoading(false);
        return;
      }

      // Show ALL backgrounds in the manifest (free and premium)
      setBackgroundsManifest(manifestData.backgrounds);

      // Set initial background - prefer free one if user isn't premium
      if (manifestData.backgrounds.length > 0) {
        const initialBg = !isPremiumUser
          ? manifestData.backgrounds.find((bg) => bg.type === 'free') ||
            manifestData.backgrounds[0]
          : manifestData.backgrounds[0];

        setSelectedBackground(initialBg.name);

        // Load the initial background immediately
        loadBackgroundImage(
          initialBg.path,
          initialBg.name,
          initialBg.updatedAt
        );

        // Start auto lazy loading other backgrounds after a delay
        startLazyLoading(manifestData.backgrounds, initialBg.name);
      }

      setManifestLoading(false);
    },
    [isPremiumUser]
  );

  // Auto lazy loading function
  const startLazyLoading = useCallback((backgrounds, skipId) => {
    // Clear any existing timeout
    if (lazyLoadTimeoutRef.current) {
      clearTimeout(lazyLoadTimeoutRef.current);
    }

    let currentIndex = 0;
    const backgroundsToLoad = backgrounds.filter((bg) => bg.name !== skipId);

    const loadNext = () => {
      if (currentIndex >= backgroundsToLoad.length) {
        return;
      }

      const bg = backgroundsToLoad[currentIndex];

      // Skip if already loaded or loading
      if (!loadingQueueRef.current.has(bg.name)) {
        loadBackgroundImage(bg.path, bg.name, bg.updatedAt);
      }

      currentIndex++;

      // Load next background after a delay (stagger the loading)
      lazyLoadTimeoutRef.current = setTimeout(loadNext, 1000); // 1 second delay between loads
    };

    // Start loading after initial UI render
    lazyLoadTimeoutRef.current = setTimeout(loadNext, 500);
  }, []);

  // Lazy load individual background image - memoized with stable dependencies
  const loadBackgroundImage = useCallback(
    async (path, id, updatedAt, forceReload = false) => {
      // Don't load if already loaded, loading, or in queue
      if (
        loadedBackgrounds[id] ||
        loadingStates[id] ||
        loadingQueueRef.current.has(id)
      ) {
        return loadedBackgrounds[id];
      }

      try {
        // Add to loading queue
        loadingQueueRef.current.add(id);

        // Set loading state
        setLoadingStates((prev) => ({ ...prev, [id]: true }));

        // Use the ref for most up-to-date cache metadata
        const currentMetadata = cacheMetadataRef.current || {};

        const { imageUrl, cacheMetadata: updatedMetadata } = await loadBgImage({
          path,
          id,
          updatedAt,
          forceReload,
          cacheMetadata: currentMetadata,
          updateProgress,
        });

        if (imageUrl) {
          // Update cache metadata immediately if it changed
          if (updatedMetadata && updatedMetadata !== currentMetadata) {
            updateCacheMetadata(updatedMetadata);
          }

          // Update loaded backgrounds state
          setLoadedBackgrounds((prev) => ({
            ...prev,
            [id]: imageUrl,
          }));

          // Clear loading state
          setLoadingStates((prev) => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
          });

          return imageUrl;
        }
      } catch (err) {
        console.error(`Error in loadBackgroundImage for ${id}:`, err);

        // Clear loading state on error
        setLoadingStates((prev) => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });

        return null;
      } finally {
        // Remove from loading queue
        loadingQueueRef.current.delete(id);
      }
    },
    [loadedBackgrounds, loadingStates, updateProgress, updateCacheMetadata]
  );

  // Initialize cache and fetch manifest
  useEffect(() => {
    const setup = async () => {
      try {
        // Initialize cache first
        const metadata = await initializeCache();

        // Update both ref and state with initial metadata
        updateCacheMetadata(metadata);

        // Debug: Log what's in the cache
        if (Object.keys(metadata).length > 0) {
        }

        // Fetch manifest (but don't download all images)

        await fetchManifest();
      } catch (error) {
        console.error('useBackgrounds: Error in initialization:', error);
        setManifestError('Failed to initialize backgrounds');
        setManifestLoading(false);
      }
    };

    setup();

    // Cleanup timeout on unmount
    return () => {
      if (lazyLoadTimeoutRef.current) {
        clearTimeout(lazyLoadTimeoutRef.current);
      }
    };
  }, [fetchManifest, updateCacheMetadata]);

  // Memoize visible backgrounds to prevent re-renders
  const visibleBackgrounds = useMemo(() => {
    return backgroundsManifest; // Show all backgrounds, but handle premium access in UI
  }, [backgroundsManifest]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Manifest data (loads instantly)
      backgroundsManifest: visibleBackgrounds,
      manifestLoading,
      manifestError,

      // Lazy-loaded images
      loadedBackgrounds,
      loadingStates,

      // Selection
      selectedBackground,
      setSelectedBackground,

      // Functions
      loadBackgroundImage,

      // Progress
      progress,

      // Cache metadata for debugging
      cacheMetadata: cacheMetadataState,
    }),
    [
      visibleBackgrounds,
      manifestLoading,
      manifestError,
      loadedBackgrounds,
      loadingStates,
      selectedBackground,
      loadBackgroundImage,
      progress,
      cacheMetadataState,
    ]
  );
}

