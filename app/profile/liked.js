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
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome for the back icon
import { fetchQuotesByIds } from 'utils/firebase/firestore'; // Function to fetch quotes by IDs
import Tile from 'components/quotes/tile/Tile'; // Reuse the Tile component for rendering quotes

const PAGE_SIZE = 10; // Number of quotes to fetch per page

export default function LikedQuotes() {
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const [likedQuotes, setLikedQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextIndex, setNextIndex] = useState(0); // Track the next start index
  const [hasMore, setHasMore] = useState(true); // Track if more quotes are available

  const loadLikedQuotes = async (isLoadMore = false) => {
    // If there are no liked quotes, stop loading and show empty state
    if (!user?.likes?.length) {
      setLoading(false);
      setHasMore(false);
      return;
    }

    if (isLoadMore && (!hasMore || loadingMore)) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const {
        quotes,
        hasMore: moreAvailable,
        nextIndex: newNextIndex,
      } = await fetchQuotesByIds(user.likes, nextIndex, PAGE_SIZE);

      setLikedQuotes((prevQuotes) => {
        const existingIds = new Set(prevQuotes.map((quote) => quote.id));
        const filteredNewQuotes = quotes.filter(
          (quote) => !existingIds.has(quote.id)
        );
        return [...prevQuotes, ...filteredNewQuotes];
      });

      setNextIndex(newNextIndex);
      setHasMore(moreAvailable);
    } catch (error) {
      console.error('Error fetching liked quotes:', error);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadLikedQuotes();
  }, []);

  useEffect(() => {
    if (!user?.likes?.length) {
      setLikedQuotes([]); // Clear the list if there are no likes
      return;
    }

    // Filter the likedQuotes to ensure they match the updated user.likes
    setLikedQuotes((prevQuotes) =>
      prevQuotes.filter((quote) => user.likes.includes(quote.id))
    );
  }, [user?.likes]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size='small' color={COLORS.primary} />;
  };

  if (loading && likedQuotes.length === 0) {
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
          onPress={() => router.push('/profile')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liked Quotes</Text>
      </View>

      {!loading && likedQuotes.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            You haven't liked any quotes yet.
          </Text>
        </View>
      )}

      {/* Liked Quotes List */}
      <FlatList
        data={likedQuotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.tileContainer}>
            <Tile quote={item} user={user} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        onEndReached={() => loadLikedQuotes(true)} // Load more quotes when reaching the end
        onEndReachedThreshold={0.5} // Trigger when 50% of the list is visible
        ListFooterComponent={renderFooter} // Show loading spinner at the bottom
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Use the app's background color
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary, // Use the app's primary color for the header
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text, // Use a contrasting color for the text
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
    backgroundColor: COLORS.surface, // Match the background color of the Tile
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // For Android shadow
  },
});

