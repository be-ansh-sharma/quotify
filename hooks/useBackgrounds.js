import { useState, useEffect } from 'react';
import { fetchAndCacheBackgrounds } from 'utils/firebase/firestorage';

// Default backgrounds included with the app
const DEFAULT_BACKGROUNDS = [
  {
    id: 'default_bg1',
    uri: require('../assets/backgrounds/bg1.jpg'),
    type: 'free',
  },
  {
    id: 'default_bg2',
    uri: require('../assets/backgrounds/bg2.jpg'),
    type: 'free',
  },
];

export default function useBackgrounds(isPremiumUser) {
  const [backgrounds, setBackgrounds] = useState(DEFAULT_BACKGROUNDS);
  const [selectedBackground, setSelectedBackground] = useState(
    DEFAULT_BACKGROUNDS[0]?.uri
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBackgrounds = async () => {
      setLoading(true);
      try {
        // Try to fetch backgrounds from Firebase
        const cachedBackgrounds = await fetchAndCacheBackgrounds(true); // Always fetch all backgrounds

        // Debug logging
        console.log('Fetched backgrounds:', cachedBackgrounds);

        if (cachedBackgrounds && cachedBackgrounds.length > 0) {
          // Use fetched backgrounds if available
          setBackgrounds(cachedBackgrounds);
          // Select first free background for non-premium users
          if (!isPremiumUser) {
            const firstFreeBackground = cachedBackgrounds.find(
              (bg) => bg.type === 'free'
            );
            setSelectedBackground(
              firstFreeBackground?.uri || DEFAULT_BACKGROUNDS[0].uri
            );
          } else {
            setSelectedBackground(
              cachedBackgrounds[0]?.uri || DEFAULT_BACKGROUNDS[0].uri
            );
          }
        } else {
          // Fallback to default backgrounds
          console.log('Using default backgrounds');
          setBackgrounds(DEFAULT_BACKGROUNDS);
          setSelectedBackground(DEFAULT_BACKGROUNDS[0].uri);
        }
      } catch (error) {
        console.error('Error loading backgrounds:', error);
        // Fallback to default backgrounds on error
        setBackgrounds(DEFAULT_BACKGROUNDS);
        setSelectedBackground(DEFAULT_BACKGROUNDS[0].uri);
      } finally {
        setLoading(false);
      }
    };

    loadBackgrounds();
  }, [isPremiumUser]);

  return {
    backgrounds,
    selectedBackground,
    setSelectedBackground,
    loading,
    isPremiumUser,
  };
}

