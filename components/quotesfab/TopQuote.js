import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from 'styles/theme';
import { getTopQuote } from 'utils/firebase/firestore'; // You'll need to create this function

export default function TopQuote() {
  const [topQuote, setTopQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        // For now, let's simulate the API call
        // In reality, you would implement getTopQuote() in your firestore.js
        setTimeout(() => {
          setTopQuote({
            text: 'The best way to predict the future is to create it.',
            author: 'Abraham Lincoln',
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching Top Quote:', error);
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  if (!topQuote) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.quoteText}>"{topQuote.text}"</Text>
      <Text style={styles.authorText}>— {topQuote.author}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: 16,
    elevation: 4,
    borderRadius: 8,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  authorText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.placeholder,
  },
  loadingContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

