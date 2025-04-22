import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import useUserStore from 'stores/userStore';
import useBackgrounds from 'hooks/useBackgrounds';
import QuotePreview from 'components/quoteedit/QuotePreview';
import BackgroundSelector from 'components/quoteedit/BackgroundSelector';
import FontControls from 'components/quoteedit/FontControls';
import ActionButtons from 'components/quoteedit/ActionButtons';
import LoadingScreen from 'components/shared/LoadingScreen';

export default function QuoteEdit() {
  const { quote, author } = useLocalSearchParams();
  const viewRef = useRef();
  const isGuest = useUserStore((state) => state.isGuest);

  // Extract background loading logic to a custom hook
  const {
    backgrounds,
    selectedBackground,
    setSelectedBackground,
    loading,
    isPremiumUser,
  } = useBackgrounds(!isGuest);

  // Typography state
  const [typography, setTypography] = useState({
    font: 'Arial',
    color: '#FFFFFF',
    size: 24,
    position: { x: 0, y: 0 },
  });

  // Update individual typography properties
  const updateTypography = (key, value) => {
    setTypography((prev) => ({ ...prev, [key]: value }));
  };

  // Update position from gesture handler
  const handleGesture = (event) => {
    updateTypography('position', {
      x: event.nativeEvent.translationX,
      y: event.nativeEvent.translationY,
    });
  };

  if (loading) {
    return <LoadingScreen message='Fetching the latest backgrounds...' />;
  }

  return (
    <View style={styles.container}>
      <QuotePreview
        ref={viewRef}
        quote={quote}
        author={author}
        backgroundUri={selectedBackground}
        typography={typography}
        onGesture={handleGesture}
      />

      <BackgroundSelector
        backgrounds={backgrounds}
        selectedBackground={selectedBackground}
        onSelectBackground={setSelectedBackground}
        isPremiumUser={false} // Assuming !isGuest means premium user
      />

      <View style={styles.controls}>
        <FontControls
          typography={typography}
          onUpdateTypography={updateTypography}
        />

        <ActionButtons
          viewRef={viewRef}
          quote={quote}
          author={author}
          onClose={() => router.back()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  controls: {
    flex: 2,
    padding: 10,
  },
});

