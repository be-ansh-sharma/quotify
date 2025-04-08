import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import Tile from './tile/Tile';
import { fetchQuotes, fetchQuotesByAuthors } from 'utils/firebase/firestore'; // Include new function to fetch quotes by authors

export default Quotes = ({
  selectedSort,
  user,
  author = null,
  tag = null,
  favoriteAuthors = false, // Add favoriteAuthors prop
}) => {
  const [quotes, setQuotes] = useState([]);
  const [lastDoc, setLastDoc] = useState(null); // Track the last document for pagination
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadQuotes = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      let fetchedQuotes;

      if (favoriteAuthors && user?.followedAuthors?.length > 0) {
        // Fetch quotes by favorite authors
        const { newQuotes, lastVisibleDoc, hasMoreQuotes } =
          await fetchQuotesByAuthors(
            user.followedAuthors,
            lastDoc,
            selectedSort
          );
        fetchedQuotes = newQuotes;
        setLastDoc(lastVisibleDoc);
        setHasMore(hasMoreQuotes);
      } else {
        // Fetch general quotes (fallback)
        const { newQuotes, lastVisibleDoc, hasMoreQuotes } = await fetchQuotes(
          lastDoc,
          selectedSort,
          author,
          tag
        );
        fetchedQuotes = newQuotes;
        setLastDoc(lastVisibleDoc);
        setHasMore(hasMoreQuotes);
      }

      // Ensure no duplicate quotes are added
      setQuotes((prevQuotes) => {
        const existingIds = new Set(prevQuotes.map((quote) => quote.id));
        const filteredNewQuotes = fetchedQuotes.filter(
          (quote) => !existingIds.has(quote.id)
        );
        return [...prevQuotes, ...filteredNewQuotes];
      });
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset and fetch quotes when sort order, author, tag, or favoriteAuthors changes
    setQuotes([]);
    setLastDoc(null);
    setHasMore(true);
    loadQuotes();
  }, [selectedSort, author, tag, favoriteAuthors]);

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator size='large' style={{ marginVertical: 20 }} />;
  };

  if (!loading && quotes.length === 0) {
    // Display a message if no quotes are found
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No quotes found by your favorite authors.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Tile quote={item} user={user} />}
        onEndReached={loadQuotes}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        decelerationRate='normal'
        scrollEventThrottle={16}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
});

