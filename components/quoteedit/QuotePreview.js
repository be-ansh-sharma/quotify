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
import Animated from 'react-native-reanimated';
import { COLORS } from 'styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const QuotePreview = ({
  quote,
  author,
  backgroundUri,
  typography,
  onGesture,
  isExport = false,
}) => {
  const { font, color, size, position } = typography;

  // Get background source
  const backgroundSource = backgroundUri ? { uri: backgroundUri } : null;

  // Add the missing getFontStyle function
  const getFontStyle = () => {
    return {
      fontFamily: font,
    };
  };

  // Get font style as before
  const fontStyle = getFontStyle();

  return (
    <View style={styles.previewContainer}>
      <View style={styles.preview}>
        <ImageBackground
          source={backgroundSource}
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageStyle}
          resizeMode='cover'
        >
          <View style={styles.overlay}>
            {isExport ? (
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.quoteText,
                    fontStyle,
                    { color, fontSize: size },
                  ]}
                >
                  {quote}
                </Text>
                {author ? (
                  <Text
                    style={[
                      styles.authorText,
                      fontStyle,
                      { color, fontSize: size * 0.6 },
                    ]}
                  >
                    — {author}
                  </Text>
                ) : null}
              </View>
            ) : (
              <PanGestureHandler onGestureEvent={onGesture}>
                <Animated.View
                  style={[
                    styles.textContainer,
                    position
                      ? {
                          transform: [
                            { translateX: position.x },
                            { translateY: position.y },
                          ],
                        }
                      : {},
                  ]}
                >
                  <Text
                    style={[
                      styles.quoteText,
                      fontStyle,
                      { color, fontSize: size },
                    ]}
                  >
                    {quote}
                  </Text>
                  {author ? (
                    <Text
                      style={[
                        styles.authorText,
                        fontStyle,
                        { color, fontSize: size * 0.6 },
                      ]}
                    >
                      — {author}
                    </Text>
                  ) : null}
                </Animated.View>
              </PanGestureHandler>
            )}
          </View>
        </ImageBackground>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)', // Optional overlay for better text visibility
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    padding: 30,
    width: '100%',
    height: '100%',
    justifyContent: 'center', // Center text vertically
    alignItems: 'center', // Center text horizontally
  },
  quoteText: {
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: COLORS.shadow || 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  authorText: {
    textAlign: 'center',
    textShadowColor: COLORS.shadow || 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    width: '100%', // Ensure container is full width
  },
  preview: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.6, // Reduced from 0.4 to 0.28 for a smaller background
    borderWidth: 1,
    borderColor: COLORS.border || '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: COLORS.shadow || '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark || '#333333', // Fallback color
  },
  exportContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  exportTextContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  exportQuoteText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  exportAuthorText: {
    textAlign: 'center',
  },
});

export default React.memo(QuotePreview);

