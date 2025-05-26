import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';
import { fetchTrendingQuotes } from 'utils/firebase/firestore';
import QuoteTile from 'components/quotes/tile/Tile';
import Header from 'components/header/Header';
import QuoteTileAd from 'components/ads/QuoteTileAd'; // Add this import
import useUserStore from 'stores/userStore';

export default function TrendingQuotes() {
  const { COLORS } = useAppTheme();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useUserStore((state) => state.user);

  // Generate styles with current theme colors
  const styles = getStyles(COLORS);

  useEffect(() => {
    const loadTrendingQuotes = async () => {
      setLoading(true);
      try {
        const data = await fetchTrendingQuotes();
        setQuotes(data);
      } catch (error) {
        console.error('Error loading trending quotes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrendingQuotes();
  }, []);

  return (
    <View style={styles.container}>
      <Header title='Trending Quotes' showBackButton={true} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size='large' color={COLORS.primary} />
        </View>
      ) : quotes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No trending quotes found.</Text>
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <>
              {index > 0 && index % 7 === 0 && !user?.isPro && <QuoteTileAd />}
              <QuoteTile quote={item} />
            </>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: COLORS.text,
      fontSize: 16,
    },
    listContent: {
      paddingHorizontal: 8,
    },
  });

