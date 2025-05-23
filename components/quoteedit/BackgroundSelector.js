import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Dimensions,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from 'styles/theme';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function BackgroundSelector({
  backgrounds,
  selectedBackground,
  onSelectBackground,
  isPremiumUser,
}) {
  const flatListRef = useRef(null);
  const selectedIndex = backgrounds.findIndex(
    (bg) => bg.uri === selectedBackground
  );
  const [currentIndex, setCurrentIndex] = useState(
    selectedIndex !== -1 ? selectedIndex : 0
  );

  // Scroll to selected item on mount
  useEffect(() => {
    if (selectedIndex > 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: selectedIndex,
        animated: false,
      });
    }
  }, []);

  const handleBackgroundSelection = (background) => {
    if (background.type === 'premium' && !isPremiumUser) {
      Alert.alert(
        'Premium Feature',
        'This is a premium background. Upgrade to access all backgrounds!',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade',
            onPress: () => router.push('/profile/pro/'),
            style: 'default',
          },
        ]
      );
      return;
    }
    onSelectBackground(background.uri);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Background</Text>

      <FlatList
        ref={flatListRef}
        data={backgrounds}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate='fast'
        snapToInterval={SCREEN_WIDTH - 32}
        snapToAlignment='center'
        contentContainerStyle={styles.listContent}
        initialScrollIndex={Math.max(0, selectedIndex)}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH - 32,
          offset: (SCREEN_WIDTH - 32) * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const contentOffset = e.nativeEvent.contentOffset.x;
          const index = Math.round(contentOffset / (SCREEN_WIDTH - 32));
          if (index >= 0 && index < backgrounds.length) {
            setCurrentIndex(index);
          }
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleBackgroundSelection(item)}
            style={[
              styles.backgroundItem,
              selectedBackground === item.uri && styles.selectedBackground,
            ]}
          >
            <ImageBackground
              source={
                typeof item.uri === 'string' ? { uri: item.uri } : item.uri
              }
              style={styles.backgroundPreview}
              imageStyle={styles.previewImage}
            >
              {item.type === 'premium' && !isPremiumUser && (
                <View style={styles.premiumBadge}>
                  <FontAwesome name='star' size={12} color='#FFD700' />
                  <Text style={styles.premiumText}>PRO</Text>
                </View>
              )}
            </ImageBackground>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => `bg-${index}`}
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {backgrounds.map((_, index) => (
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
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginHorizontal: 16,
    color: COLORS.text,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  backgroundItem: {
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_WIDTH * 0.25,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 16,
    backgroundColor: COLORS.surface,
  },
  selectedBackground: {
    borderColor: COLORS.primary,
  },
  backgroundPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  previewImage: {
    borderRadius: 8,
  },
  premiumBadge: {
    backgroundColor: COLORS.overlayDark || 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    margin: 8,
  },
  premiumText: {
    color: COLORS.premiumGold || '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: COLORS.border || '#DDD',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
  },
});

export default React.memo(BackgroundSelector);

