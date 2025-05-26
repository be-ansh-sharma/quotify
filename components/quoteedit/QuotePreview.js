import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useAppTheme } from 'context/AppThemeContext'; // Add this import

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const QuotePreview = ({
  quote,
  author,
  backgroundUri,
  typography,
  onGesture,
  isExport = false,
  aspectRatio = 1, // Default to square
}) => {
  const { font, color, size, position } = typography;
  const { COLORS } = useAppTheme(); // Now this will work
  const styles = getStyles(COLORS);

  // Get font style
  const getFontStyle = () => {
    return {
      fontFamily: font,
    };
  };
  const fontStyle = getFontStyle();

  return (
    <View style={[styles.container, { aspectRatio: aspectRatio }]}>
      {backgroundUri ? (
        <Image
          source={{ uri: backgroundUri }}
          style={styles.backgroundImage}
          resizeMode='cover'
        />
      ) : (
        <View
          style={[styles.backgroundImage, { backgroundColor: COLORS.surface }]}
        />
      )}
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
            </Animated.View>
          </PanGestureHandler>
        )}
      </View>
    </View>
  );
};

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      width: '100%',
      aspectRatio: 1.5, // or 2 for a wider, less tall preview
      position: 'relative',
      overflow: 'hidden',
    },
    backgroundImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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

