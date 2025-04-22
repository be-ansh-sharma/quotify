import React, { forwardRef } from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { COLORS } from 'styles/theme';

const QuotePreview = forwardRef(
  ({ quote, author, backgroundUri, typography, onGesture }, ref) => {
    const { font, color, size, position } = typography;

    // Instead of external placeholder, use a local color as fallback
    const backgroundSource = backgroundUri ? { uri: backgroundUri } : null;

    return (
      <View ref={ref} style={styles.preview}>
        <ImageBackground
          source={backgroundSource}
          style={styles.background}
          imageStyle={styles.backgroundImage}
          resizeMode='cover'
          // Use a fallback background color if image fails to load
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
                {
                  fontFamily: font,
                  color: color,
                  fontSize: size,
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
    );
  }
);

const styles = StyleSheet.create({
  preview: {
    flex: 3,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333333', // Fallback color instead of placeholder image
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

