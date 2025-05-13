import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ActivityIndicator, Card } from 'react-native-paper';
import { useAppTheme } from 'context/AppThemeContext';

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
  const { COLORS, isDark } = useAppTheme(); // Get theme and dark mode status
  const quote = getRandomQuote();

  const styles = getStyles(COLORS, isDark);

  return (
    <View style={styles.container}>
      <Card style={styles.card} mode='elevated'>
        <Card.Content style={styles.content}>
          <ActivityIndicator
            animating={true}
            color={COLORS.primary}
            size='large'
          />
          <Text
            style={[styles.quoteText, { color: COLORS.primary }]}
          >{`"${quote}"`}</Text>
        </Card.Content>
      </Card>
    </View>
  );
};

// Convert static styles to a function that takes COLORS and isDark
const getStyles = (COLORS, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.background, // Ensure it matches the theme
    },
    card: {
      padding: 24,
      borderRadius: 16,
      width: '90%', // Make the card responsive
      backgroundColor: COLORS.surface,
      shadowColor: isDark ? COLORS.shadow : 'rgba(0, 0, 0, 0.1)', // Subtle shadow for light themes
      shadowOpacity: isDark ? 0.3 : 0.1, // Adjust shadow opacity
      shadowRadius: isDark ? 8 : 4, // Adjust shadow radius
      shadowOffset: { width: 0, height: isDark ? 4 : 2 },
      elevation: isDark ? 6 : 3, // Android shadow
    },
    content: {
      alignItems: 'center',
      gap: 16,
    },
    quoteText: {
      fontSize: 16,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 16,
    },
  });

export default Skelton;

