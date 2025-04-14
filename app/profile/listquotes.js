import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons';
import Tile from 'components/quotes/tile/Tile';
import {
  fetchQuotesInBatches,
  removeQuoteFromList,
  deleteListFromUser,
} from 'utils/firebase/firestore'; // Import Firestore logic

const BATCH_SIZE = 10; // Number of quotes to fetch per batch

export default function ListQuotes() {
  const router = useRouter();
  const { listName, quotes } = useLocalSearchParams(); // Use useLocalSearchParams
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [listQuotes, setListQuotes] = useState(JSON.parse(quotes));
  const [quoteDetails, setQuoteDetails] = useState([]); // Store fetched quote data
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // Track lazy loading state
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0); // Track the current batch index

  // Initial fetch
  useEffect(() => {
    const fetchInitialQuotes = async () => {
      try {
        const initialQuotes = await fetchQuotesInBatches(listQuotes, 0); // Fetch the first batch
        setQuoteDetails(removeDuplicates(initialQuotes)); // Remove duplicates
      } catch (error) {
        console.error('Error fetching initial quotes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialQuotes();
  }, [listQuotes]);

  // Fetch more quotes when the user scrolls to the end
  const fetchMoreQuotes = async () => {
    if (loadingMore || currentBatchIndex >= listQuotes.length) return; // Prevent duplicate fetches

    setLoadingMore(true);
    try {
      const nextBatch = await fetchQuotesInBatches(
        listQuotes,
        currentBatchIndex
      );
      setQuoteDetails(
        (prev) => removeDuplicates([...prev, ...nextBatch]) // Append and remove duplicates
      );
      setCurrentBatchIndex((prev) => prev + BATCH_SIZE); // Update the batch index
    } catch (error) {
      console.error('Error fetching more quotes:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Remove duplicates based on quote ID
  const removeDuplicates = (quotes) => {
    const uniqueQuotes = [];
    const seenIds = new Set();

    for (const quote of quotes) {
      if (!seenIds.has(quote.id)) {
        uniqueQuotes.push(quote);
        seenIds.add(quote.id);
      }
    }

    return uniqueQuotes;
  };

  // Handle deleting the entire list
  const handleDeleteList = () => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete the list "${listName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove the list from Firestore
              await deleteListFromUser(user.uid, listName);

              // Update the user's bookmarklist in local state
              const updatedBookmarklist = { ...user.bookmarklist };
              delete updatedBookmarklist[listName];
              setUser({ ...user, bookmarklist: updatedBookmarklist });

              // Navigate back to the bookmarked lists page
              router.push('/profile/bookmarked');
            } catch (error) {
              console.error(`Error deleting list "${listName}":`, error);
              Alert.alert(
                'Error',
                'Failed to delete the list. Please try again later.'
              );
            }
          },
        },
      ]
    );
  };

  // Handle removing a quote from the list
  const handleRemoveQuote = (quoteId) => {
    Alert.alert(
      'Remove Quote',
      'Are you sure you want to remove this quote from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove the quote from the user's list in Firestore
              await removeQuoteFromList(user.uid, listName, quoteId);

              // Update the local state
              const updatedQuotes = listQuotes.filter((id) => id !== quoteId);
              setListQuotes(updatedQuotes);

              setQuoteDetails((prev) =>
                prev.filter((quote) => quote.id !== quoteId)
              );

              console.log(`Quote ${quoteId} removed successfully.`);
            } catch (error) {
              console.error(`Error removing quote ${quoteId}:`, error);
              Alert.alert(
                'Error',
                'Failed to remove the quote. Please try again later.'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile/bookmarked')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{listName}</Text>
        <TouchableOpacity
          onPress={handleDeleteList}
          style={styles.deleteListButton}
        >
          <FontAwesome name='trash' size={20} color={COLORS.icon} />
        </TouchableOpacity>
      </View>

      {/* Quotes in the List */}
      {quoteDetails.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            This list is empty. Add quotes to it!
          </Text>
        </View>
      ) : (
        <FlatList
          data={quoteDetails}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.tileContainer}>
              <View style={{ flex: 1 }}>
                {/* Constrain Tile to available space */}
                <Tile quote={item} user={user} />
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveQuote(item.id)}
              >
                <FontAwesome name='trash' size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={fetchMoreQuotes} // Trigger lazy loading
          onEndReachedThreshold={0.5} // Trigger when 50% of the list is visible
          ListFooterComponent={
            loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size='small' color={COLORS.primary} />
              </View>
            )
          }
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Space between back button, title, and delete button
    padding: 16,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1, // Allow title to take available space
    textAlign: 'center',
  },
  deleteListButton: {
    marginLeft: 12,
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
    backgroundColor: COLORS.background,
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
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row', // Ensure horizontal layout
    alignItems: 'center', // Align items vertically
    justifyContent: 'space-between', // Space between Tile and removeButton
    padding: 16,
  },
  removeButton: {
    marginLeft: 16,
    padding: 8, // Add padding for better touch area
    alignSelf: 'center', // Ensure the button stays centered vertically
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

