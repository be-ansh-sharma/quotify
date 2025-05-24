import { useState, useEffect, useRef } from 'react';
import { Platform, Dimensions } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Simplified formats - one optimal format per platform
const SHARE_FORMATS = [
  {
    id: 'instagram',
    name: 'Instagram',
    aspectRatio: 1, // Square is most versatile for Instagram
    width: 1080,
    height: 1080,
    platform: 'instagram',
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    aspectRatio: 9 / 16,
    width: 1080,
    height: 1920,
    platform: 'instagram',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    aspectRatio: 1.91, // Facebook recommended ratio
    width: 1200,
    height: 630,
    platform: 'facebook',
  },
  {
    id: 'twitter',
    name: 'Twitter',
    aspectRatio: 16 / 9, // Twitter's ideal ratio
    width: 1200,
    height: 675,
    platform: 'twitter',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    aspectRatio: 1.91,
    width: 1200,
    height: 627,
    platform: 'linkedin',
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    aspectRatio: 2 / 3, // Pinterest vertical pins work best
    width: 1000,
    height: 1500,
    platform: 'pinterest',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    aspectRatio: 9 / 16, // TikTok uses vertical format
    width: 1080,
    height: 1920,
    platform: 'tiktok',
  },
  {
    id: 'wallpaper',
    name: 'Phone Wallpaper',
    aspectRatio: 9 / 19.5, // iPhone aspect ratio
    width: 1170,
    height: 2532,
    platform: 'general',
  },
];

export const useQuoteFormatting = (viewRef, selectedBackground) => {
  const [selectedFormat, setSelectedFormat] = useState(SHARE_FORMATS[0]); // Default to Instagram
  const [previewUri, setPreviewUri] = useState(null);
  const [processing, setProcessing] = useState(false);
  const invisibleViewRef = useRef(null);
  const [invisiblePreviewDimensions, setInvisiblePreviewDimensions] =
    useState(null);

  // Update invisible preview dimensions when format changes
  useEffect(() => {
    if (selectedFormat) {
      // Use the exact width/height from the selected format
      setInvisiblePreviewDimensions({
        width: selectedFormat.width,
        height: selectedFormat.height,
      });
    }
  }, [selectedFormat]);

  const getExportTypography = (typography) => {
    // Scale typography based on format size
    const scaleFactor = selectedFormat.width / SCREEN_WIDTH;
    return {
      ...typography,
      size: typography.size * scaleFactor,
      position: {
        x: typography.position.x * scaleFactor,
        y: typography.position.y * scaleFactor,
      },
    };
  };

  const createFormattedQuoteImage = async (typography) => {
    setProcessing(true);
    try {
      // Make sure to wait a bit for the invisible view to render
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Capture the high-resolution version with proper dimensions
      const uri = await invisibleViewRef.current.capture();
      setPreviewUri(uri);
      return uri;
    } catch (error) {
      console.error('Error creating image:', error);
      return null;
    } finally {
      setProcessing(false);
    }
  };

  return {
    selectedFormat,
    setSelectedFormat,
    previewUri,
    processing,
    invisiblePreviewDimensions,
    invisibleViewRef,
    createFormattedQuoteImage,
    getExportTypography,
    SHARE_FORMATS,
  };
};

