import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import Tile from './tile/Tile';
import {
  fetchQuotes,
  fetchQuotesByAuthors,
  fetchQuotesByMood,
} from 'utils/firebase/firestore';
import SkeletonLoader from 'components/skelton/Skelton';
import { saveQuotesToCache, getQuotesFromCache } from 'utils/quotesCache';
import { useTabBar } from 'context/TabBarContext';

export default Quotes = ({
  selectedSort,
  selectedMood = 'all',
  user,
  author = null,
  tag = null,
  followedAuthors = false,
}) => {
  const [quotes, setQuotes] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [processedChunks, setProcessedChunks] = useState(0);

  // Add this to track mood changes
  const prevMoodRef = useRef(selectedMood);
  const prevSortRef = useRef(selectedSort);

  const { showTabBar, hideTabBar } = useTabBar();
  const scrollOffset = useRef(0);
  const scrollDirection = useRef('up');

  const handleScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > scrollOffset.current ? 'down' : 'up';

    // Only trigger changes when direction actually changes or at top/bottom
    if (
      direction !== scrollDirection.current ||
      currentOffset <= 0 ||
      (direction === 'down' && currentOffset > 200)
    ) {
      scrollDirection.current = direction;

      if (direction === 'down' && currentOffset > 20) {
        hideTabBar();
      } else if (direction === 'up') {
        showTabBar();
      }
    }

    scrollOffset.current = currentOffset;
  };

  const loadQuotes = async () => {
    if (loading || !hasMore) return;

    console.log(
      `📚 Loading quotes | Mood: ${selectedMood} | Sort: ${selectedSort}`
    );

    setLoading(true);
    try {
      let fetchedQuotes;

      if (followedAuthors && user?.followedAuthors?.length > 0) {
        console.log(
          `🧑‍🎨 Fetching followed author quotes with mood: ${selectedMood}`
        );
        // Fetch quotes by favorite authors with mood filtering
        const {
          newQuotes,
          lastVisibleDoc,
          hasMoreQuotes,
          processedChunks: updatedChunks,
        } = await fetchQuotesByAuthors(
          user.followedAuthors,
          lastDoc,
          selectedSort,
          processedChunks,
          selectedMood !== 'all' ? selectedMood : null
        );
        fetchedQuotes = newQuotes;
        setLastDoc(lastVisibleDoc);
        setHasMore(hasMoreQuotes);
        setProcessedChunks(updatedChunks);
      } else if (author || tag) {
        console.log(`🏷️ Fetching by author/tag with mood: ${selectedMood}`);
        // Fetch quotes by author or tag with mood
        const { newQuotes, lastVisibleDoc, hasMoreQuotes } = await fetchQuotes(
          lastDoc,
          selectedSort,
          author,
          tag,
          selectedMood !== 'all' ? selectedMood : null
        );
        fetchedQuotes = newQuotes;
        setLastDoc(lastVisibleDoc);
        setHasMore(hasMoreQuotes);
      } else {
        // General quotes filtered by mood
        if (selectedMood !== 'all') {
          console.log(`😊 Fetching by mood: ${selectedMood}`);
          // Use the dedicated mood filter function
          const { newQuotes, lastVisibleDoc, hasMoreQuotes } =
            await fetchQuotesByMood(selectedMood, lastDoc, selectedSort);
          fetchedQuotes = newQuotes;
          setLastDoc(lastVisibleDoc);
          setHasMore(hasMoreQuotes);
          console.log(
            `📙 Fetched ${
              fetchedQuotes?.length || 0
            } quotes for mood: ${selectedMood}`
          );
        } else {
          console.log(`📚 Fetching all quotes without mood filter`);
          // Regular quotes without mood filter
          const { newQuotes, lastVisibleDoc, hasMoreQuotes } =
            await fetchQuotes(lastDoc, selectedSort);
          fetchedQuotes = newQuotes;
          setLastDoc(lastVisibleDoc);
          setHasMore(hasMoreQuotes);
        }
      }

      // Set quotes - ONLY ONCE per fetch cycle
      if (lastDoc === null) {
        setQuotes(fetchedQuotes || []);
        console.log(`✅ Initial set: ${fetchedQuotes?.length || 0} quotes`);
      } else {
        setQuotes((prevQuotes) => {
          const existingIds = new Set(prevQuotes.map((quote) => quote.id));
          const filteredNewQuotes = fetchedQuotes.filter(
            (quote) => !existingIds.has(quote.id)
          );
          console.log(`✅ Added ${filteredNewQuotes.length} more quotes`);
          return [...prevQuotes, ...filteredNewQuotes];
        });
      }
    } catch (error) {
      console.error('❌ Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Log when mood or sort changes to verify the effect is running
    if (prevMoodRef.current !== selectedMood) {
      console.log(
        `🔄 MOOD CHANGED from '${prevMoodRef.current}' to '${selectedMood}'`
      );
      prevMoodRef.current = selectedMood;
    }

    if (prevSortRef.current !== selectedSort) {
      console.log(
        `🔄 SORT CHANGED from '${prevSortRef.current}' to '${selectedSort}'`
      );
      prevSortRef.current = selectedSort;
    }

    // Reset state when filter/sort/mood changes
    setQuotes([]);
    setLastDoc(null);
    setHasMore(true);
    setProcessedChunks(0);
    setLoading(true);

    setTimeout(() => {
      loadQuotes();
    }, 50);

    return () => {
      // cleanup
    };
  }, [selectedSort, selectedMood, author, tag, followedAuthors]);

  const renderFooter = () => {
    if (!loading) return null;
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
            : selectedMood !== 'all'
            ? `No quotes found for the "${selectedMood}" mood.`
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
        onScroll={handleScroll} // Add scroll handler
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

