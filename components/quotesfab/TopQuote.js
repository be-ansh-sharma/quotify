import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAppTheme } from 'context/AppThemeContext'; // Import theme hook
import { getTopQuote } from 'utils/firebase/firestore';

export default function TopQuote() {
  const [topQuote, setTopQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  const { COLORS } = useAppTheme(); // Get theme colors dynamically
  const styles = getStyles(COLORS); // Generate styles dynamically

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
      <Text style={styles.reactionsText}>
        ♥ {topQuote.totalReactions || 0} reactions
      </Text>
    </View>
  );
}

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
    reactionsText: {
      fontSize: 14,
      color: COLORS.primary,
      marginTop: 4,
    },
    loadingContainer: {
      padding: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

