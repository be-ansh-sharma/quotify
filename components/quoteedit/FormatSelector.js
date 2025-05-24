import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.45; // Reduced to just 45% of screen width
const CARD_SPACING = 6; // Even smaller spacing

// Platform icons mapping
const PLATFORM_ICONS = {
  instagram: { name: 'instagram', color: '#C13584', label: 'Instagram' },
  facebook: { name: 'facebook', color: '#1877F2', label: 'Facebook' },
  twitter: { name: 'twitter', color: '#1DA1F2', label: 'Twitter' },
  tiktok: { name: 'music-note', color: '#000000', label: 'TikTok' },
  linkedin: { name: 'linkedin', color: '#0077B5', label: 'LinkedIn' },
  pinterest: { name: 'pinterest', color: '#E60023', label: 'Pinterest' },
  general: { name: 'cellphone', color: '#6C757D', label: 'General' },
};

const FormatSelector = ({ formats, selectedFormat, setSelectedFormat }) => {
  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  // Format aspect ratio for display
  const formatRatio = (aspectRatio) => {
    if (aspectRatio === 1) return '1:1';
    if (aspectRatio > 1) return `${Math.round(aspectRatio * 10) / 10}:1`;
    return `1:${Math.round((1 / aspectRatio) * 10) / 10}`;
  };

  // Handle snap to item
  const handleScrollEnd = (e) => {
    const contentOffset = e.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / (CARD_WIDTH + CARD_SPACING));
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Format</Text>

      <FlatList
        ref={flatListRef}
        data={formats}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment='center'
        decelerationRate='fast'
        contentContainerStyle={styles.carouselContent}
        onMomentumScrollEnd={handleScrollEnd}
        initialScrollIndex={formats.findIndex(
          (f) => f.id === selectedFormat.id
        )}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH + CARD_SPACING,
          offset: (CARD_WIDTH + CARD_SPACING) * index,
          index,
        })}
        renderItem={({ item }) => {
          const platform = item.platform || 'general';
          const icon = PLATFORM_ICONS[platform];

          return (
            <TouchableOpacity
              style={[
                styles.formatCard,
                selectedFormat.id === item.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedFormat(item)}
              activeOpacity={0.7}
            >
              {/* Combined header with icon and name */}
              <View
                style={[
                  styles.platformBadge,
                  {
                    backgroundColor: icon?.color || COLORS.backgroundSecondary,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={icon?.name || 'share-variant'}
                  size={12}
                  color='#FFFFFF'
                />
                <Text style={styles.platformName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>

              {/* Format preview */}
              <View style={styles.previewContainer}>
                <View
                  style={[
                    styles.previewShape,
                    { aspectRatio: item.aspectRatio },
                  ]}
                />
                <Text style={styles.formatInfo}>
                  {formatRatio(item.aspectRatio)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {formats.map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
      marginHorizontal: 20,
      color: COLORS.text,
    },
    carouselContent: {
      paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
      paddingVertical: 4,
    },
    formatCard: {
      width: CARD_WIDTH,
      height: 100, // Significantly reduced height
      marginRight: CARD_SPACING,
      borderRadius: 8,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    selectedCard: {
      borderColor: COLORS.primary,
      borderWidth: 2,
      backgroundColor: `${COLORS.primary}10`,
    },
    platformBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: COLORS.backgroundSecondary,
    },
    platformName: {
      color: '#FFFFFF',
      fontWeight: '500',
      marginLeft: 3,
      fontSize: 10,
      flex: 1,
    },
    previewContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 6,
    },
    previewShape: {
      backgroundColor: `${COLORS.primary}20`,
      borderColor: `${COLORS.primary}40`,
      borderWidth: 1,
      width: '65%',
      height: undefined,
      maxHeight: 50,
      borderRadius: 2,
    },
    formatInfo: {
      fontSize: 9,
      color: COLORS.textSecondary,
      marginTop: 4,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 6,
    },
    paginationDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: COLORS.border,
      marginHorizontal: 2,
    },
    paginationDotActive: {
      backgroundColor: COLORS.primary,
      width: 7,
      height: 7,
      borderRadius: 4,
    },
  });

export default FormatSelector;

