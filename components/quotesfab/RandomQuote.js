import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons';
import { getRandomQuote } from 'utils/firebase/firestore'; // You'll need to create this function

export default function RandomQuote() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNewQuote = async () => {
    setLoading(true);
    try {
      // For now, let's simulate the API call
      // In reality, you would implement getRandomQuote() in your firestore.js
      setTimeout(() => {
        // Simulate different quotes
        const quotes = [
          {
            text: 'The only way to do great work is to love what you do.',
            author: 'Steve Jobs',
          },
          {
            text: "Life is what happens when you're busy making other plans.",
            author: 'John Lennon',
          },
          {
            text: 'The future belongs to those who believe in the beauty of their dreams.',
            author: 'Eleanor Roosevelt',
          },
        ];
        const randomIndex = Math.floor(Math.random() * quotes.length);
        setQuote(quotes[randomIndex]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching random quote:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewQuote();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  if (!quote) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.quoteText}>"{quote.text}"</Text>
      <Text style={styles.authorText}>— {quote.author}</Text>

      <TouchableOpacity style={styles.refreshButton} onPress={fetchNewQuote}>
        <FontAwesome name='refresh' size={18} color={COLORS.primary} />
        <Text style={styles.refreshText}>New Random Quote</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    elevation: 4,
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
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  refreshText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});

