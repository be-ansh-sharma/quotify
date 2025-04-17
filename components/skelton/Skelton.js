import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ActivityIndicator, Card, useTheme } from 'react-native-paper';
import { COLORS } from 'styles/theme';
// If you're using Lottie
// import LottieView from 'lottie-react-native';

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
  const { colors } = useTheme();
  const quote = getRandomQuote();

  return (
    <View style={styles.container}>
      <Card style={styles.card} mode='elevated'>
        <Card.Content style={styles.content}>
          <ActivityIndicator
            animating={true}
            color={colors.primary}
            size='large'
          />
          <Text
            style={[styles.quoteText, { color: colors.primary }]}
          >{`"${quote}"`}</Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    //alignItems: 'center',
  },
  card: {
    padding: 24,
    borderRadius: 16,
    minWidth: '75%',
    backgroundColor: COLORS.background,
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

