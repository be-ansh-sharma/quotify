import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons';
import { fetchQuotesByUser } from 'utils/firebase/firestore'; // Function to fetch quotes by the user
import Tile from 'components/quotes/tile/Tile'; // Reuse the Tile component for rendering quotes
import { deletePrivateQuote } from 'utils/firebase/firestore'; // Import the new function
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';

export default function MyQuotes() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isGuest = useUserStore((state) => state.isGuest);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null); // Track the last document for lazy loading
  const [hasMoreQuotes, setHasMoreQuotes] = useState(true); // Check if more quotes are available
  const [filter, setFilter] = useState('public'); // 'public' or 'private'

  const loadQuotes = async (isLoadMore = false) => {
    if (isLoadMore && !hasMoreQuotes) return; // Stop if no more quotes to load

    isLoadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const { quotes: newQuotes, lastVisibleDoc } = await fetchQuotesByUser(
        user?.uid,
        lastDoc,
        filter === 'private'
      );

      setQuotes((prev) => (isLoadMore ? [...prev, ...newQuotes] : newQuotes));
      setLastDoc(lastVisibleDoc);
      setHasMoreQuotes(newQuotes.length > 0); // If no new quotes, stop loading more
    } catch (error) {
      console.error('Error fetching user quotes:', error);
    } finally {
      isLoadMore ? setLoadingMore(false) : setLoading(false);
    }
  };

  const handleDeletePrivateQuote = async (quoteId) => {
    try {
      await deletePrivateQuote(quoteId); // Call the extracted function
      setQuotes((prev) => prev.filter((quote) => quote.id !== quoteId)); // Update the state
      SnackbarService.show('Private quote deleted successfully.');
    } catch (error) {
      console.error('Error deleting private quote:', error);
      SnackbarService.show('Failed to delete the quote. Please try again.');
    }
  };

  useEffect(() => {
    if (!isGuest) {
      loadQuotes();
    }
  }, [filter]); // Reload quotes when the filter changes

  const renderEmptyState = (message) => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  const renderQuoteList = () => (
    <FlatList
      data={quotes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.tileContainer}>
          <Tile quote={item} user={user} />
          {filter === 'private' && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePrivateQuote(item.id)}
            >
              <FontAwesome name='trash' size={16} color={COLORS.error} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      contentContainerStyle={styles.listContent}
      onEndReached={() => loadQuotes(true)} // Load more quotes when reaching the end
      onEndReachedThreshold={0.5} // Trigger when 50% from the bottom
      ListFooterComponent={
        loadingMore && <ActivityIndicator size='small' color={COLORS.primary} />
      }
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  if (isGuest) {
    return renderEmptyState('Login to view your posted quotes.');
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Quotes</Text>
      </View>

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'public' && styles.activeFilter,
          ]}
          onPress={() => setFilter('public')}
        >
          <Text style={styles.filterText}>Public</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'private' && styles.activeFilter,
          ]}
          onPress={() => setFilter('private')}
        >
          <Text style={styles.filterText}>Private</Text>
        </TouchableOpacity>
      </View>

      {/* Quote List */}
      {quotes.length > 0
        ? renderQuoteList()
        : renderEmptyState(
            filter === 'public'
              ? "You haven't posted any public quotes yet."
              : "You haven't saved any private quotes yet."
          )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeFilter: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.text,
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
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.placeholder,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 8,
  },
  tileContainer: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center', // Align icon and text vertically
    justifyContent: 'flex-start', // Align content to the left
    marginTop: 8,
    paddingHorizontal: 8, // Add padding for better spacing
  },
  deleteButtonText: {
    marginLeft: 4,
    fontSize: 14, // Slightly larger font for better readability
    color: COLORS.error,
  },
});

