import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert, // Import Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from 'components/header/Header'; // Import Header component
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';
import { MaterialIcons } from '@expo/vector-icons'; // Switch to MaterialIcons
import { fetchQuotesByUser } from 'utils/firebase/firestore';
import Tile from 'components/quotes/tile/Tile';
import { deletePrivateQuote } from 'utils/firebase/firestore';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';

export default function MyQuotes() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isGuest = useUserStore((state) => state.isGuest);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMoreQuotes, setHasMoreQuotes] = useState(true);
  const [filter, setFilter] = useState('public'); // 'public' or 'private'

  // Existing functions and effects...
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
    Alert.alert(
      'Confirm Delete', // Title
      'Are you sure you want to delete this private quote? This action cannot be undone.', // Message
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deletePrivateQuote(quoteId);
              setQuotes((prev) => prev.filter((quote) => quote.id !== quoteId));
              SnackbarService.show('Private quote deleted successfully.');
            } catch (error) {
              console.error('Error deleting private quote:', error);
              SnackbarService.show(
                'Failed to delete the quote. Please try again.'
              );
            }
          },
        },
      ],
      { cancelable: true } // Allows dismissing by tapping outside on Android
    );
  };

  useEffect(() => {
    if (!isGuest) {
      loadQuotes();
    }
  }, [filter]);

  const renderEmptyState = (message) => (
    <View style={styles.container}>
      {/* Use Header component */}
      <Header title='My Quotes' backRoute='/profile' />

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'public' && styles.activeFilter,
          ]}
          onPress={() => setFilter('public')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'public' && styles.activeFilterText,
            ]}
          >
            Public
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'private' && styles.activeFilter,
          ]}
          onPress={() => setFilter('private')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'private' && styles.activeFilterText,
            ]}
          >
            Private
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{message}</Text>
      </View>
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
              <MaterialIcons name='delete' size={16} color={COLORS.error} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      contentContainerStyle={styles.listContent}
      onEndReached={() => loadQuotes(true)}
      onEndReachedThreshold={0.5}
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
      {/* Use Header component instead of custom header */}
      <Header title='My Quotes' backRoute='/profile' />

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'public' && styles.activeFilter,
          ]}
          onPress={() => setFilter('public')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'public' && styles.activeFilterText,
            ]}
          >
            Public
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'private' && styles.activeFilter,
          ]}
          onPress={() => setFilter('private')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'private' && styles.activeFilterText,
            ]}
          >
            Private
          </Text>
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
  // Remove header styles since we use the Header component
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.disabled + '20', // Slightly transparent border
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
  activeFilterText: {
    color: COLORS.icon, // Use icon color for text on primary background
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
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
    paddingBottom: 16, // Add padding at the bottom for better spacing
  },
  tileContainer: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.shadow, // Use theme shadow color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 12, // Increased padding for better tap target
    borderTopWidth: 1,
    borderTopColor: COLORS.disabled + '20', // Slightly transparent border
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
  },
});

