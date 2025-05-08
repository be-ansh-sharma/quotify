import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons';
import { getQuoteOfTheDay } from 'utils/firebase/firestore';
import ShareSheet from 'components/bottomsheet/ShareSheet';
import { router } from 'expo-router';

export default function QuoteOfTheDay() {
  const [quoteOfTheDay, setQuoteOfTheDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const shareSheetRef = useRef(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const data = await getQuoteOfTheDay();
        setQuoteOfTheDay(data);
      } catch (error) {
        console.error('Error fetching Quote of the Day:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  // Share as text
  const handleShareAsText = async () => {
    if (!quoteOfTheDay) return;
    try {
      await Share.share({
        message: `"${quoteOfTheDay.text}"\n\n— ${
          quoteOfTheDay.author || 'Unknown'
        }\n\nShared via Quotify`,
      });
      shareSheetRef.current?.closeBottomSheet();
    } catch (error) {
      console.error('Error sharing as text:', error);
    }
  };

  // Share as photo (placeholder, implement with ViewShot if needed)
  const handleShareAsPhoto = async () => {
    shareSheetRef.current?.closeBottomSheet();
    router.push({
      pathname: '/quotes/quoteshare',
      params: { quote: quoteOfTheDay.text, author: quoteOfTheDay.author },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  if (!quoteOfTheDay) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <FontAwesome name='calendar' size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.quoteContentContainer}>
        <Text style={styles.quoteText}>"{quoteOfTheDay.text}"</Text>
        <Text style={styles.authorText}>— {quoteOfTheDay.author}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => shareSheetRef.current?.openBottomSheet()}
        >
          <FontAwesome name='share' size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ShareSheet
        ref={shareSheetRef}
        onShareAsText={handleShareAsText}
        onShareAsPhoto={handleShareAsPhoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight || '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quoteContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quoteText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 26,
  },
  authorText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.textSecondary || '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

