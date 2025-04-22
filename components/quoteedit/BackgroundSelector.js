import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from 'styles/theme';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';

function BackgroundSelector({
  backgrounds,
  selectedBackground,
  onSelectBackground,
  isPremiumUser,
}) {
  const handleBackgroundSelection = (background) => {
    // Show snackbar if guest tries to select premium background
    if (background.type === 'premium' && !isPremiumUser) {
      SnackbarService.show(
        'This is a premium background. Upgrade to access all backgrounds!'
      );
      return; // Prevent selection
    }
    onSelectBackground(background.uri);
  };

  // Filter out no backgrounds - show ALL backgrounds to ALL users
  // No filtering here means both free and premium backgrounds are shown

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Background</Text>
      <View style={styles.grid}>
        {backgrounds.map((background) => (
          <TouchableOpacity
            key={background.id}
            style={[
              styles.backgroundOption,
              selectedBackground === background.uri &&
                styles.selectedBackground,
            ]}
            onPress={() => handleBackgroundSelection(background)}
          >
            <ImageBackground
              source={
                typeof background.uri === 'string'
                  ? { uri: background.uri }
                  : background.uri
              }
              style={styles.backgroundPreview}
              imageStyle={styles.previewImage}
            >
              {background.type === 'premium' && (
                <View style={styles.premiumBadge}>
                  <FontAwesome name='star' size={12} color='#FFD700' />
                  <Text style={styles.premiumText}>PRO</Text>
                </View>
              )}
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  backgroundOption: {
    width: '31%',
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
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
    borderRadius: 6,
  },
  premiumBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    margin: 4,
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});

export default React.memo(BackgroundSelector);

