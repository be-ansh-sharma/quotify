import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import useUserStore from 'stores/userStore';
import useBackgrounds from 'hooks/useBackgrounds';
import QuotePreview from 'components/quoteedit/QuotePreview';
import BackgroundSelector from 'components/quoteedit/BackgroundSelector';
import FontControls from 'components/quoteedit/FontControls';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { COLORS } from 'styles/theme';
import ViewShot from 'react-native-view-shot';

export default function QuoteEdit() {
  const { quote, author } = useLocalSearchParams();
  const viewRef = useRef();

  // Store user data in ref to prevent re-render loops
  const storeDataRef = useRef(null);

  // Typography state
  const [typography, setTypography] = useState({
    font: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
    color: '#FFFFFF',
    size: 24,
    position: { x: 0, y: 0 },
  });

  // Get user data once and update ref
  useEffect(() => {
    const { isGuest, user } = useUserStore.getState();
    storeDataRef.current = { isGuest, user };

    // Subscribe to store changes
    const unsubscribe = useUserStore.subscribe((state) => {
      storeDataRef.current = {
        isGuest: state.isGuest,
        user: state.user,
      };
    });

    return unsubscribe;
  }, []);

  // Use isPremiumUser from ref, wrapped in useMemo to prevent dependency changes
  const isPremiumUser = useMemo(
    () => !!storeDataRef.current?.user?.isPremiumUser,
    []
  );

  // Use the backgrounds hook with the stable isPremiumUser value
  const { backgrounds, selectedBackground, setSelectedBackground, loading } =
    useBackgrounds(isPremiumUser);

  // Update typography functions
  const updateTypography = (key, value) => {
    setTypography((prev) => ({ ...prev, [key]: value }));
  };

  // Gesture handler for quote positioning
  const handleGesture = (event) => {
    updateTypography('position', {
      x: event.nativeEvent.translationX,
      y: event.nativeEvent.translationY,
    });
  };

  // Share function
  const handleShare = async () => {
    try {
      // Check if the viewRef is valid
      if (!viewRef.current) {
        Alert.alert('Error', 'Unable to capture quote. Please try again.');
        return;
      }

      // Using ViewShot's capture method directly
      const uri = await viewRef.current.capture();

      // Verify that we got a valid URI
      if (!uri || typeof uri !== 'string') {
        throw new Error('Failed to capture image');
      }

      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your quote',
      });
    } catch (error) {
      console.error('Error sharing quote:', error);
      Alert.alert('Error', 'Failed to share quote. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading backgrounds...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Wrap QuotePreview with ViewShot */}
      <ViewShot
        ref={viewRef}
        options={{ format: 'png', quality: 1 }}
        style={{ flex: 1 }}
      >
        <QuotePreview
          quote={quote}
          author={author}
          backgroundUri={selectedBackground}
          typography={typography}
          onGesture={handleGesture}
        />
      </ViewShot>

      {/* Controls */}
      <ScrollView style={styles.scrollContainer}>
        {/* Background Selector */}
        <BackgroundSelector
          backgrounds={backgrounds}
          selectedBackground={selectedBackground}
          onSelectBackground={setSelectedBackground}
          isPremiumUser={isPremiumUser}
        />

        {/* Typography Controls */}
        <FontControls
          typography={typography}
          onUpdateTypography={updateTypography}
        />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.buttonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  cancelButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

