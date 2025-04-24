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
    <View style={styles.container}>
      <ImageBackground
        source={backgroundSource}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle} // Add this
        resizeMode='cover' // Important! Change from "contain" to "cover"
      >
        <View style={styles.overlay}>
          {isExport ? (
            <View style={styles.textContainer}>
              <Text
                style={[styles.quoteText, fontStyle, { color, fontSize: size }]}
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
            </PanGestureHandler>
          )}
        </View>
      </ImageBackground>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteText: {
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  authorText: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
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
  quoteText: {
    textAlign: 'center',
    padding: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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

