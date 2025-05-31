import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';
import { getTopQuote } from 'utils/firebase/firestore';
import QuoteFABActions from './QuoteFABActions';

export default function TopQuote() {
  const [topQuote, setTopQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const fetchedQuote = await getTopQuote();
        setTopQuote(fetchedQuote);
      } catch (error) {
        console.error('Error fetching Top Quote:', error);
      } finally {
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

      {/* Remove the custom reactions text and use QuoteFABActions instead */}
      <QuoteFABActions quote={topQuote} />
    </View>
  );
}

// Update getStyles to remove the reactionsText style if not needed anymore
const getStyles = (COLORS) =>
  StyleSheet.create({
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
      marginBottom: 4,
    },
    loadingContainer: {
      padding: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

