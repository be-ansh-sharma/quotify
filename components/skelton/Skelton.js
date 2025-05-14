import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';
import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const quotes = [
  'Inhale confidence, exhale doubt.',
  'Small steps every day.',
  'Your vibe attracts your tribe.',
  "Believe you can and you're halfway there.",
  'You are your only limit.',
  'Progress, not perfection.',
  'Start where you are. Use what you have. Do what you can.',
  'Be fearless in the pursuit of what sets your soul on fire.',
  'Confidence is silent. Insecurities are loud.',
  'The best view comes after the hardest climb.',
  'You’ve got what it takes.',
  'Shine so bright that others light up too.',
  'Your potential is endless.',
  'Don’t wait for opportunity. Create it.',
  'The magic is in you.',
  'You are stronger than you think.',
  "Keep going. You're growing.",
  'Everything you need is already inside you.',
  'Dream big. Start small. Act now.',
  'Doubt kills more dreams than failure ever will.',
];

const getRandomQuote = () => {
  return quotes[Math.floor(Math.random() * quotes.length)];
};

const Skelton = () => {
  const { COLORS, isDark } = useAppTheme();
  const quote = getRandomQuote();
  const lottieRef = useRef(null);

  useEffect(() => {
    if (lottieRef.current) {
      setTimeout(() => {
        lottieRef.current?.play();
      }, 100);
    }
  }, []);

  const styles = getStyles(COLORS, isDark);

  return (
    <View style={styles.container}>
      <LottieView
        ref={lottieRef}
        source={require('../../assets/animations/loading.json')}
        style={styles.lottieAnimation}
        autoPlay
        loop
      />

      <Text style={styles.quoteText}>{`"${quote}"`}</Text>
    </View>
  );
};

const getStyles = (COLORS, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center', // This centers vertically
      alignItems: 'center', // This centers horizontally
      backgroundColor: COLORS.background,
      paddingHorizontal: 20,
      // Don't set explicit width/height for better flex behavior
    },
    lottieAnimation: {
      width: 200,
      height: 200,
    },
    quoteText: {
      fontSize: 18,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 24,
      color: COLORS.primary,
      fontWeight: '500',
      lineHeight: 26,
      maxWidth: 320, // Limit text width for better readability
    },
  });

export default Skelton;

