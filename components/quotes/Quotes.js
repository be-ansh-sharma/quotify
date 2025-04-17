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
import SkeletonLoader from 'components/skelton/Skelton';

export default Quotes = ({
  selectedSort,
  user,
  author = null, // Filter by specific author
  tag = null, // Filter by specific tag
  followedAuthors = false, // Add followedAuthors prop
}) => {
  const [quotes, setQuotes] = useState([]);
  const [lastDoc, setLastDoc] = useState(null); // Track the last document for pagination
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [processedChunks, setProcessedChunks] = useState(0); // Track processed chunks for favorite authors
  console.log(user);

  const loadQuotes = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      let fetchedQuotes;

      if (followedAuthors && user?.followedAuthors?.length > 0) {
        // Fetch quotes by favorite authors
        const {
          newQuotes,
          lastVisibleDoc,
          hasMoreQuotes,
          processedChunks: updatedChunks,
        } = await fetchQuotesByAuthors(
          user.followedAuthors,
          lastDoc,
          selectedSort,
          processedChunks // Pass the current processedChunks
        );
        fetchedQuotes = newQuotes;
        setLastDoc(lastVisibleDoc);
        setHasMore(hasMoreQuotes);
        setProcessedChunks(updatedChunks); // Update the processedChunks state
      } else if (author) {
        // Fetch quotes by a specific author
        const { newQuotes, lastVisibleDoc, hasMoreQuotes } = await fetchQuotes(
          lastDoc,
          selectedSort,
          author,
          null // No tag filtering
        );
        fetchedQuotes = newQuotes;
        setLastDoc(lastVisibleDoc);
        setHasMore(hasMoreQuotes);
      } else if (tag) {
        // Fetch quotes by a specific tag
        const { newQuotes, lastVisibleDoc, hasMoreQuotes } = await fetchQuotes(
          lastDoc,
          selectedSort,
          null, // No author filtering
          tag
        );
        fetchedQuotes = newQuotes;
        setLastDoc(lastVisibleDoc);
        setHasMore(hasMoreQuotes);
      } else {
        // Fetch general quotes (no author or tag filtering)
        const { newQuotes, lastVisibleDoc, hasMoreQuotes } = await fetchQuotes(
          lastDoc,
          selectedSort
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
    // Reset and fetch quotes when sort order, author, tag, or followedAuthors changes
    setQuotes([]);
    setLastDoc(null);
    setHasMore(true);
    setProcessedChunks(0); // Reset processedChunks when filters change
    loadQuotes();
  }, [selectedSort, author, tag, followedAuthors]);

  const renderFooter = () => {
    if (!loading) return null;
    //return <ActivityIndicator size='large' style={{ marginVertical: 20 }} />;
    return <SkeletonLoader />;
  };

  if (!loading && quotes.length === 0) {
    // Display a message if no quotes are found
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {followedAuthors
            ? 'No quotes found by your favorite authors.'
            : author
            ? `No quotes found by ${author}.`
            : tag
            ? `No quotes found for the tag "${tag}".`
            : 'No quotes found.'}
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

