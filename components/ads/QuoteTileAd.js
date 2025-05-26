import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { useAppTheme } from 'context/AppThemeContext';
import { getAdUnitId } from 'utils/ads/adUnitIds';

// Use the same style logic as Tile.js
const getTileStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      backgroundColor: COLORS.surface,
      borderRadius: 8,
      marginTop: 12,
      marginBottom: 2,
      shadowColor: COLORS.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
      shadowOffset: { width: 0, height: 1 },
      borderLeftWidth: 3,
      borderLeftColor: COLORS.secondary || COLORS.accent1 || '#9C27B0',
      borderWidth: 0.5,
      borderColor: 'rgba(255,255,255,0.05)',
      overflow: 'hidden',
    },
    adBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      zIndex: 999,
    },
    adBadgeText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
    adContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
    },
  });

const QuoteTileAd = () => {
  const { COLORS } = useAppTheme();
  const styles = getTileStyles(COLORS);

  return (
    <View style={styles.container}>
      <View style={styles.adBadge}>
        <Text style={styles.adBadgeText}>AD</Text>
      </View>

      <View style={styles.adContainer}>
        <BannerAd
          unitId={getAdUnitId('banner')}
          size={BannerAdSize.MEDIUM_RECTANGLE}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdFailedToLoad={(error) => {
            console.log('Ad failed to load:', error);
          }}
        />
      </View>
    </View>
  );
};

export default QuoteTileAd;

