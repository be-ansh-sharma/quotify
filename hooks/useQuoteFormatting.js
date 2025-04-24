import { useState, useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import { cropToAspectRatio, resizeImage } from 'utils/imageManipulation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define share formats
export const SHARE_FORMATS = [
  {
    id: 'instagram_square',
    name: 'Instagram (1:1)',
    aspectRatio: 1 / 1,
    width: 1080,
    height: 1080,
    icon: 'instagram',
  },
  {
    id: 'instagram_portrait',
    name: 'Instagram (4:5)',
    aspectRatio: 4 / 5,
    width: 1080,
    height: 1350,
    icon: 'instagram',
  },
  {
    id: 'instagram_story',
    name: 'Story (9:16)',
    aspectRatio: 9 / 16,
    width: 1080,
    height: 1920,
    icon: 'mobile',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    aspectRatio: 1.91 / 1,
    width: 1200,
    height: 630,
    icon: 'facebook',
  },
  {
    id: 'twitter',
    name: 'Twitter',
    aspectRatio: 16 / 9,
    width: 1200,
    height: 675,
    icon: 'twitter',
  },
];

export const useQuoteFormatting = (viewRef, selectedBackground) => {
  const [selectedFormat, setSelectedFormat] = useState(SHARE_FORMATS[0]);
  const [processing, setProcessing] = useState(false);
  const [invisiblePreviewDimensions, setInvisiblePreviewDimensions] =
    useState(null);
  const invisibleViewRef = useRef();

  // Create a high-resolution quote image for sharing
  const createFormattedQuoteImage = async (typography) => {
    try {
      setProcessing(true);

      setInvisiblePreviewDimensions({
        width: selectedFormat.width,
        height: selectedFormat.height,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!invisibleViewRef.current) {
        setProcessing(false);
        return null;
      }

      const uri = await invisibleViewRef.current.capture();
      const finalUri = await resizeImage(
        uri,
        selectedFormat.width,
        selectedFormat.height
      );

      setProcessing(false);
      return finalUri;
    } catch (error) {
      console.error('Error creating image:', error);
      setProcessing(false);
      return null;
    }
  };

  // Calculate scaled typography for export
  const getExportTypography = (typography) => {
    return {
      ...typography,
      // Increase the 0.6 scaling factor to 1.2 for larger text
      size: Math.round(
        typography.size * (selectedFormat.width / SCREEN_WIDTH) * 1.2
      ),
      position: { x: 0, y: 0 },
    };
  };

  return {
    selectedFormat,
    setSelectedFormat,
    processing,
    invisiblePreviewDimensions,
    invisibleViewRef,
    createFormattedQuoteImage,
    getExportTypography,
    SHARE_FORMATS,
  };
};

