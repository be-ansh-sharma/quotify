import React from 'react';
import { TouchableOpacity, Text, Share, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';

function ActionButtons({ viewRef, quote, author, onClose }) {
  const handleShare = async () => {
    try {
      // Capture the view as an image
      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 0.8,
      });

      // Share the captured image
      await Share.share({
        message: `"${quote}" - ${author}`,
        url: uri,
      });
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareButtonText}>Share</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  shareButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333',
    fontSize: 16,
  },
});

export default React.memo(ActionButtons);
