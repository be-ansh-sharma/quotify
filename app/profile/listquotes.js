import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
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
} from 'utils/firebase/firestore';

export default function ListQuotes() {
  const router = useRouter();
  const { listName, quotes } = useLocalSearchParams();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [listQuotes, setListQuotes] = useState(JSON.parse(quotes));
  const [quoteDetails, setQuoteDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);

  // Initial fetch
  useEffect(() => {
    const fetchInitialQuotes = async () => {
      try {
        const initialQuotes = await fetchQuotesInBatches(listQuotes, 0);
        setQuoteDetails(removeDuplicates(initialQuotes));
      } catch (error) {
        console.error('Error fetching initial quotes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialQuotes();
  }, [listQuotes]);

  // Share the entire list
  const handleShareList = async () => {
    const formattedQuotes = quoteDetails
      .map((quote, index) => `${index + 1}. ${quote.text} - ${quote.author}`)
      .join('\n');
    const message = `Check out my list "${listName}" on Quotify:\n\n${formattedQuotes}`;

    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing the list:', error);
    }
  };

  const handleDeleteList = async () => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete the list "${listName}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove the list from Firestore
              await deleteListFromUser(user.uid, listName);

              // Update the user store to remove the list locally
              const updatedLists = { ...user.lists };
              delete updatedLists[listName];
              setUser({
                ...user,
                lists: updatedLists,
              });

              console.log(`List "${listName}" deleted successfully.`);
              router.push('/profile/bookmarked'); // Navigate back to the bookmarked lists
            } catch (error) {
              console.error('Error deleting the list:', error);
              Alert.alert(
                'Error',
                'Failed to delete the list. Please try again.'
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
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleShareList}
            style={styles.shareButton}
          >
            <FontAwesome name='share-alt' size={20} color={COLORS.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteList}
            style={styles.deleteListButton}
          >
            <FontAwesome name='trash' size={20} color={COLORS.icon} />
          </TouchableOpacity>
        </View>
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
          onEndReached={fetchMoreQuotes}
          onEndReachedThreshold={0.5}
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
    justifyContent: 'space-between',
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
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    marginRight: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  removeButton: {
    marginLeft: 16,
    padding: 8,
    alignSelf: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

