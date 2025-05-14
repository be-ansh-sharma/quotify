import { useState, useEffect, useRef } from 'react';
import { Platform, Dimensions } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define standard formats with proper aspect ratios
const SHARE_FORMATS = [
  { id: 'square', name: 'Square', aspectRatio: 1, width: 1080, height: 1080 },
  {
    id: 'portrait',
    name: 'Portrait',
    aspectRatio: 4 / 5,
    width: 1080,
    height: 1350,
  },
  {
    id: 'landscape',
    name: 'Landscape',
    aspectRatio: 16 / 9,
    width: 1920,
    height: 1080,
  },
  {
    id: 'story',
    name: 'Story',
    aspectRatio: 9 / 16,
    width: 1080,
    height: 1920,
  },
  {
    id: 'twitter',
    name: 'Twitter',
    aspectRatio: 1.91 / 1,
    width: 1200,
    height: 628,
  },
];

export const useQuoteFormatting = (viewRef, selectedBackground) => {
  const [selectedFormat, setSelectedFormat] = useState(SHARE_FORMATS[0]); // Default to square
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

