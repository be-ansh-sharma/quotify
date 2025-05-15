import { useState } from 'react';
import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { updateShareCount } from 'utils/firebase/firestore';

export const useShareQuote = () => {
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();

  const shareImage = async (imageUri, formatName) => {
    try {
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/png',
        dialogTitle: `Share your quote (${formatName})`,
      });
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image');
    }
  };

  const saveToPhotos = async (imageUri) => {
    try {
      // Check permissions first
      if (!mediaPermission?.granted) {
        const permission = await requestMediaPermission();
        if (!permission.granted) {
          Alert.alert(
            'Permission required',
            'Please allow access to save photos'
          );
          return;
        }
      }

      // Once we have permission, save to library
      await MediaLibrary.saveToLibraryAsync(imageUri);
      Alert.alert('Success', 'Image saved to your photo library');
    } catch (error) {
      console.error('Error saving to photos:', error);
      Alert.alert('Error', 'Failed to save image to photos');
    }
  };

  const handleShare = async (createImageFn, formatName, quoteID) => {
    try {
      // Create the quote image with exact dimensions
      const imageUri = await createImageFn();
      console.log('Image quoteIDquoteIDquoteID:', quoteID);

      if (!imageUri) {
        throw new Error('Failed to create image');
      }

      await updateShareCount(quoteID);

      // Let user choose to share or download
      Alert.alert(
        'Share or Download',
        'What would you like to do with this quote?',
        [
          {
            text: 'Share',
            onPress: () => shareImage(imageUri, formatName),
          },
          {
            text: 'Save to Photos',
            onPress: () => saveToPhotos(imageUri),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to create or share quote image');
    }
  };

  return {
    handleShare,
    mediaPermission,
  };
};

