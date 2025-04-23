import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { COLORS } from 'styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const QuotePreview = ({
  quote,
  author,
  backgroundUri,
  typography,
  onGesture,
}) => {
  const { font, color, size, position } = typography;

  // Instead of external placeholder, use a local color as fallback
  const backgroundSource = backgroundUri ? { uri: backgroundUri } : null;

  const getFontStyle = () => {
    // Different handling for different platforms
    const { font } = typography;

    // For iOS, we can use the font name directly
    if (Platform.OS === 'ios') {
      return { fontFamily: font };
    }

    // For Android, handle specific cases
    switch (font) {
      case 'sans-serif':
        return { fontFamily: 'sans-serif' };
      case 'serif':
        return { fontFamily: 'serif' };
      case 'monospace':
        return { fontFamily: 'monospace' };
      case 'sans-serif-condensed':
        return { fontFamily: 'sans-serif-condensed' };
      default:
        return { fontFamily: font };
    }
  };

  return (
    <View style={styles.previewContainer}>
      <View style={styles.preview}>
        <ImageBackground
          source={backgroundSource}
          style={styles.background}
          imageStyle={styles.backgroundImage}
          resizeMode='cover'
          onError={(e) =>
            console.error(
              'Error loading background image:',
              e.nativeEvent.error
            )
          }
        >
          <PanGestureHandler onGestureEvent={onGesture}>
            <Text
              style={[
                styles.quoteText,
                getFontStyle(),
                {
                  color: typography.color,
                  fontSize: typography.size,
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                  ],
                },
              ]}
            >
              "{quote}" - {author}
            </Text>
          </PanGestureHandler>
        </ImageBackground>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, // Slightly reduced padding
    width: '100%', // Ensure container is full width
  },
  preview: {
    // Full width as requested
    width: '100%',
    height: SCREEN_HEIGHT * 0.6, // Increased height (was 0.28)
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333', // Fallback color
  },
  backgroundImage: {
    opacity: 0.8, // Slightly dim the image for better text readability
  },
  quoteText: {
    textAlign: 'center',
    padding: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default React.memo(QuotePreview);

