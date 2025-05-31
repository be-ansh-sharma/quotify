import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';
import { getRandomQuote } from 'utils/firebase/firestore';
import QuoteFABActions from './QuoteFABActions';

export default function RandomQuote() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  const fetchNewQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      const randomQuote = await getRandomQuote();
      setQuote(randomQuote);
    } catch (error) {
      console.error('Error fetching random quote:', error);
      setError('Could not load a random quote. Please try again.');
    } finally {
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

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchNewQuote}>
          <FontAwesome name='refresh' size={18} color={COLORS.primary} />
          <Text style={styles.refreshText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!quote) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.quoteText}>"{quote.text}"</Text>
      <Text style={styles.authorText}>— {quote.author}</Text>

      {/* Use the shared action component, passing the refresh function */}
      <QuoteFABActions quote={quote} refreshQuote={fetchNewQuote} />
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
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
    errorText: {
      fontSize: 16,
      color: COLORS.error,
      marginBottom: 16,
      textAlign: 'center',
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

