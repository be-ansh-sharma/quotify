import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Share,
  ActivityIndicator,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { COLORS } from 'styles/theme';

const ActionButtons = ({ viewRef, quote, author, onClose }) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);

      // Add a small delay to ensure the view is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Check if viewRef is valid
      if (!viewRef.current) {
        console.error('ViewRef is not valid');
        setIsSharing(false);
        return;
      }

      // Capture the view
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
        result: 'file',
      });

      // Check if file was created successfully
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Failed to capture image');
      }

      // Share the image
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your quote',
          UTI: 'public.png',
        });
      } else {
        // Fallback to Share API if Sharing module isn't available
        await Share.share({
          title: `Quote by ${author}`,
          message: `"${quote}" - ${author}`,
          url: uri,
        });
      }
    } catch (error) {
      console.error('Error sharing quote:', error);
      alert('Sorry, there was a problem sharing your quote. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={onClose}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.shareButton,
          isSharing && styles.disabledButton,
        ]}
        onPress={handleShare}
        disabled={isSharing}
      >
        {isSharing ? (
          <ActivityIndicator size='small' color='#fff' />
        ) : (
          <Text style={styles.shareButtonText}>Share Quote</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '45%',
  },
  cancelButton: {
    backgroundColor: '#F2F2F2',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    backgroundColor: `${COLORS.primary}80`, // 50% opacity
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ActionButtons;

