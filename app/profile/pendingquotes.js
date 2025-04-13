import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from 'styles/theme';
import {
  fetchPendingQuotes,
  approveQuote,
  rejectQuote,
} from 'utils/firebase/firestore';

export default function PendingQuotes() {
  const [pendingQuotes, setPendingQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPendingQuotes = async () => {
    setLoading(true);
    try {
      const quotes = await fetchPendingQuotes();
      setPendingQuotes(quotes);
    } catch (error) {
      console.error('Error loading pending quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (quote) => {
    try {
      await approveQuote(quote);
      setPendingQuotes((prev) => prev.filter((q) => q.id !== quote.id)); // Remove the approved quote from the list
    } catch (error) {
      console.error('Error approving quote:', error);
    }
  };

  const handleReject = async (quoteId) => {
    try {
      await rejectQuote(quoteId);
      setPendingQuotes((prev) => prev.filter((q) => q.id !== quoteId)); // Remove the rejected quote from the list
    } catch (error) {
      console.error('Error rejecting quote:', error);
    }
  };

  useEffect(() => {
    loadPendingQuotes();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  if (!loading && pendingQuotes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No pending quotes to review.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Quotes</Text>
      </View>

      {/* Pending Quotes List */}
      <FlatList
        data={pendingQuotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>{item.text}</Text>
            <Text style={styles.quoteAuthor}>- {item.author}</Text>
            {/* Display Tags */}
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.map((tag, index) => (
                  <Text key={index} style={styles.tag}>
                    #{tag}
                  </Text>
                ))}
              </View>
            )}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.approveButton]}
                onPress={() => handleApprove(item)}
              >
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => handleReject(item.id)}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.placeholder,
  },
  listContent: {
    paddingBottom: 16,
  },
  quoteCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quoteText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 14,
    color: COLORS.placeholder,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: COLORS.icon,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    color: COLORS.onPrimary,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: COLORS.tag,
    color: COLORS.tagText,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});

