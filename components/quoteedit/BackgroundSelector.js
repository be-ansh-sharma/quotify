import React, { useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

// Memoize individual background item to prevent unnecessary re-renders
const BackgroundItem = memo(
  ({
    item,
    isSelected,
    isLoaded,
    isLoading,
    isPremium,
    isLocked,
    loadedBackgrounds,
    onPress,
  }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.backgroundItem, isSelected && styles.selectedItem]}
      >
        {isLoaded ? (
          // Image is loaded - show it
          <>
            <Image
              source={{ uri: loadedBackgrounds[item.name] }}
              style={styles.backgroundImage}
            />
            {isSelected && (
              <View style={styles.selectedOverlay}>
                <Text style={styles.selectedText}>✓</Text>
              </View>
            )}
            {/* Removed the locked overlay with lock icon */}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>PRO</Text>
              </View>
            )}
          </>
        ) : isLoading ? (
          // Currently loading
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='small' color='#007AFF' />
            <Text style={styles.loadingText}>Loading...</Text>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>PRO</Text>
              </View>
            )}
          </View>
        ) : (
          // Not loaded yet - show placeholder
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Loading...</Text>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>PRO</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isLoaded === nextProps.isLoaded &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.isLocked === nextProps.isLocked &&
      prevProps.item.name === nextProps.item.name
    );
  }
);

const BackgroundSelector = memo(
  ({
    backgroundsManifest = [],
    loadedBackgrounds = {},
    loadingStates = {},
    selectedBackground,
    onSelectBackground,
    isPremiumUser = false,
    loadBackgroundImage,
  }) => {
    // Create a memoized handler for premium dialog
    const showPremiumDialog = useCallback(() => {
      Alert.alert(
        'Premium Feature',
        'This background is only available to premium subscribers.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade to Premium',
            onPress: () => router.push('/profile/pro'),
          },
        ]
      );
    }, []);

    // Create a memoized press handler factory
    const createPressHandler = useCallback(
      (itemName, isLocked) => {
        return () => {
          if (isLocked) {
            showPremiumDialog();
            return;
          }
          onSelectBackground(itemName);
        };
      },
      [onSelectBackground, showPremiumDialog]
    );

    // Memoize the renderItem function to prevent re-renders
    const renderItem = useCallback(
      ({ item }) => {
        const isSelected = item.name === selectedBackground;
        const isLoaded = !!loadedBackgrounds[item.name];
        const isLoading = !!loadingStates[item.name];
        const isPremium = item.type === 'premium';
        const isLocked = isPremium && !isPremiumUser;

        // Create the press handler outside of render
        const handlePress = createPressHandler(item.name, isLocked);

        return (
          <BackgroundItem
            item={item}
            isSelected={isSelected}
            isLoaded={isLoaded}
            isLoading={isLoading}
            isPremium={isPremium}
            isLocked={isLocked}
            loadedBackgrounds={loadedBackgrounds}
            onPress={handlePress}
          />
        );
      },
      [
        selectedBackground,
        loadedBackgrounds,
        loadingStates,
        isPremiumUser,
        createPressHandler,
      ]
    );

    // Memoize keyExtractor
    const keyExtractor = useCallback((item) => item.name, []);

    if (!backgroundsManifest || backgroundsManifest.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>Backgrounds</Text>
          <Text style={styles.emptyText}>No backgrounds available</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Backgrounds</Text>

        <FlatList
          data={backgroundsManifest}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={10}
          initialNumToRender={4}
          updateCellsBatchingPeriod={50}
          // Add these for better performance
          getItemLayout={(data, index) => ({
            length: 88, // item width + margin
            offset: 88 * index,
            index,
          })}
        />
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for the entire component
    return (
      prevProps.backgroundsManifest.length ===
        nextProps.backgroundsManifest.length &&
      prevProps.selectedBackground === nextProps.selectedBackground &&
      Object.keys(prevProps.loadedBackgrounds).length ===
        Object.keys(nextProps.loadedBackgrounds).length &&
      Object.keys(prevProps.loadingStates).length ===
        Object.keys(nextProps.loadingStates).length &&
      prevProps.isPremiumUser === nextProps.isPremiumUser
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  backgroundItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginHorizontal: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Removed lockedOverlay and lockIcon styles
  premiumBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FFD700',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  placeholderText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#666',
  },
});

export default BackgroundSelector;

