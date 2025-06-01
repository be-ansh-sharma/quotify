import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import useUserStore from 'stores/userStore';
import useBackgrounds from 'hooks/useBackgrounds';
import QuotePreview from 'components/quoteedit/QuotePreview';
import BackgroundSelector from 'components/quoteedit/BackgroundSelector';
import FontControls from 'components/quoteedit/FontControls';
import FormatSelector from 'components/quoteedit/FormatSelector';
import ActionButtons from 'components/quoteedit/ActionButtons';
import ViewShot from 'react-native-view-shot';
import { useAppTheme } from 'context/AppThemeContext';
import { Platform } from 'react-native';
import { useQuoteFormatting } from 'hooks/useQuoteFormatting';
import { useShareQuote } from 'hooks/useShareQuote';
import Header from 'components/header/Header';
import Skelton from 'components/skelton/Skelton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function QuoteShare() {
  const { quote, author, id } = useLocalSearchParams();
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

  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

  // Get user data once and update ref
  useEffect(() => {
    const { user } = useUserStore.getState();
    storeDataRef.current = { user };

    // Subscribe to store changes
    const unsubscribe = useUserStore.subscribe((state) => {
      storeDataRef.current = {
        user: state.user,
      };
    });

    return unsubscribe;
  }, []);

  // Use isPremiumUser from ref, wrapped in useMemo to prevent dependency changes
  const isPremiumUser = !!storeDataRef.current?.user?.isPro;

  // Use the backgrounds hook with the stable isPremiumUser value
  const {
    backgroundsManifest,
    manifestLoading,
    manifestError,
    loadedBackgrounds,
    loadingStates,
    selectedBackground,
    setSelectedBackground,
    loadBackgroundImage,
    progress,
  } = useBackgrounds(isPremiumUser);

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

  // Use the quote formatting hook
  const {
    selectedFormat,
    setSelectedFormat,
    previewUri,
    processing,
    invisiblePreviewDimensions,
    invisibleViewRef,
    createFormattedQuoteImage,
    getExportTypography,
    SHARE_FORMATS,
  } = useQuoteFormatting(viewRef, selectedBackground);

  // Use the share quote hook
  const { handleShare } = useShareQuote();

  // Handle share button press
  const onSharePress = async () => {
    handleShare(
      () => createFormattedQuoteImage(typography),
      selectedFormat.name,
      id
    );
  };

  if (manifestLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading backgrounds...</Text>
        <Skelton />
      </View>
    );
  }

  // Show error state if manifest failed to load
  if (manifestError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Error: {manifestError}</Text>
        <TouchableOpacity onPress={() => window.location.reload()}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get the current background URI for the preview
  const currentBackgroundUri =
    selectedBackground && loadedBackgrounds
      ? loadedBackgrounds[selectedBackground]
      : null;

  return (
    <View style={styles.container}>
      <Header
        title='Share Quote'
        backAction={() => router.push('/home')}
        showBackButton={true}
      />

      {/* Preview area */}
      <View style={styles.previewContainer}>
        <ViewShot
          ref={viewRef}
          options={{ format: 'png', quality: 1 }}
          style={styles.viewShot}
        >
          <QuotePreview
            quote={quote}
            author={author}
            backgroundUri={currentBackgroundUri}
            typography={typography}
            onGesture={handleGesture}
          />
        </ViewShot>
      </View>

      {/* Controls area */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        alwaysBounceVertical={true}
      >
        {/* Format Selector */}
        <FormatSelector
          formats={SHARE_FORMATS}
          selectedFormat={selectedFormat}
          setSelectedFormat={setSelectedFormat}
        />

        {/* Background Selector */}
        <BackgroundSelector
          backgroundsManifest={backgroundsManifest}
          loadedBackgrounds={loadedBackgrounds}
          loadingStates={loadingStates}
          selectedBackground={selectedBackground}
          onSelectBackground={setSelectedBackground}
          isPremiumUser={isPremiumUser} // Use the local variable
          loadBackgroundImage={loadBackgroundImage}
        />

        {/* Typography Controls */}
        <FontControls
          typography={typography}
          onUpdateTypography={updateTypography}
        />

        {/* Action Buttons */}
        <ActionButtons onShare={onSharePress} />
      </ScrollView>

      {/* Invisible high-resolution preview for capture */}
      {invisiblePreviewDimensions && (
        <View style={styles.invisiblePreviewContainer}>
          <ViewShot
            ref={invisibleViewRef}
            options={{
              format: 'png',
              quality: 1,
              width: invisiblePreviewDimensions.width,
              height: invisiblePreviewDimensions.height,
            }}
            style={{
              width: invisiblePreviewDimensions.width,
              height: invisiblePreviewDimensions.height,
            }}
          >
            <QuotePreview
              quote={quote}
              author={author}
              backgroundUri={currentBackgroundUri}
              typography={getExportTypography(typography)}
              onGesture={null}
              isExport={true}
              aspectRatio={selectedFormat.aspectRatio}
            />
          </ViewShot>
        </View>
      )}

      {processing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size='large' color={COLORS.primary} />
          <Text style={styles.loadingText}>Processing image...</Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    previewContainer: {
      height: SCREEN_HEIGHT * 0.5, // 30% of screen height
      width: '100%',
      padding: 0,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.surface,
      marginBottom: 0,
    },
    viewShot: {
      width: '100%',
      height: '100%',
      borderRadius: 0,
    },
    scrollContainer: {
      flex: 1,
      marginTop: 10,
    },
    scrollContent: {
      paddingTop: 20,
      paddingBottom: 80,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.background,
    },
    loadingText: {
      fontSize: 16,
      color: COLORS.placeholder,
      marginTop: 10,
    },
    invisiblePreviewContainer: {
      position: 'absolute',
      top: -9999,
      left: -9999,
      width: 1,
      height: 1,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: COLORS.surface,
      opacity: 0.8,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    header: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: COLORS.surface,
      justifyContent: 'flex-start',
    },
    backButton: {
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.text,
    },
    errorText: {
      fontSize: 16,
      color: 'red',
      marginBottom: 10,
    },
    retryText: {
      fontSize: 16,
      color: COLORS.primary,
      textDecorationLine: 'underline',
    },
  });

