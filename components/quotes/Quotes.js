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
    const distance = Math.abs(currentOffset - scrollOffset.current);

    // Only respond to significant scroll movements
    if (distance < 3) {
      scrollOffset.current = currentOffset;
      return;
    }

    // If scrolling quickly, respond immediately
    const isQuickScroll = distance > 15;

    if (
      direction !== scrollDirection.current ||
      currentOffset <= 10 || // Show bar at top
      isQuickScroll
    ) {
      scrollDirection.current = direction;

      if (direction === 'down' && currentOffset > 20) {
        hideTabBar();
      } else if (direction === 'up' || currentOffset <= 10) {
        showTabBar();
      }
    }

    scrollOffset.current = currentOffset;
  };

  // Add this inside your Quotes component
  const getCacheKey = () => {
    // Create a unique cache key based only on content filters
    return `quotes_${selectedSort}_${selectedMood}_${author || 'null'}_${
      tag || 'null'
    }_${followedAuthors ? 'followed' : 'all'}`;
  };

  const loadQuotes = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      // STEP 1: Check cache ONLY on first page load
      if (lastDoc === null) {
        const cacheKey = getCacheKey();
        const cachedData = await getQuotesFromCache(cacheKey);

        if (cachedData) {
          console.log(`📦 Using cached quotes for ${cacheKey}`);
          setQuotes(cachedData.quotes || []);
          setLastDoc(cachedData.lastDoc || null);
          setHasMore(cachedData.hasMore !== false);
          setProcessedChunks(cachedData.processedChunks || 0);
          setLoading(false);
          return; // Exit early, no need to hit Firestore
        }
      }

      // STEP 2: If no cache or not first page, fetch from Firestore
      let fetchedQuotes = [];
      let lastVisibleDoc = null;
      let hasMoreQuotes = true;
      let updatedChunks = processedChunks;

      console.log(`📚 Last followedAuthors: ${followedAuthors}`);

      if (followedAuthors && user?.followedAuthors?.length > 0) {
        const result = await fetchQuotesByAuthors(
          user.followedAuthors,
          lastDoc,
          selectedSort,
          processedChunks,
          selectedMood !== 'all' ? selectedMood : null
        );
        fetchedQuotes = result.newQuotes || [];
        lastVisibleDoc = result.lastVisibleDoc;
        hasMoreQuotes = result.hasMoreQuotes;
        updatedChunks = result.processedChunks;
      } else if (author || tag) {
        console.log(`🏷️ Fetching by author/tag with mood: ${selectedMood}`);
        // Fetch quotes by author or tag with mood
        const result = await fetchQuotes(
          lastDoc,
          selectedSort,
          author,
          tag,
          selectedMood !== 'all' ? selectedMood : null
        );
        fetchedQuotes = result.newQuotes || [];
        lastVisibleDoc = result.lastVisibleDoc;
        hasMoreQuotes = result.hasMoreQuotes;
      } else {
        // General quotes filtered by mood
        if (selectedMood !== 'all') {
          console.log(`😊 Fetching by mood: ${selectedMood}`);
          // Use the dedicated mood filter function
          const result = await fetchQuotesByMood(
            selectedMood,
            lastDoc,
            selectedSort
          );
          fetchedQuotes = result.newQuotes || [];
          lastVisibleDoc = result.lastVisibleDoc;
          hasMoreQuotes = result.hasMoreQuotes;
          console.log(
            `📙 Fetched ${
              fetchedQuotes?.length || 0
            } quotes for mood: ${selectedMood}`
          );
        } else {
          console.log(`📚 Fetching all quotes without mood filter`);
          // Regular quotes without mood filter
          const result = await fetchQuotes(lastDoc, selectedSort);
          fetchedQuotes = result.newQuotes || [];
          lastVisibleDoc = result.lastVisibleDoc;
          hasMoreQuotes = result.hasMoreQuotes;
        }
      }

      // STEP 3: Update state with fetched data
      if (lastDoc === null) {
        // First page - set quotes directly and SAVE TO CACHE
        setQuotes(fetchedQuotes || []);

        // Cache ONLY the first page results
        const cacheKey = getCacheKey();
        await saveQuotesToCache(cacheKey, {
          quotes: fetchedQuotes || [],
          lastDoc: lastVisibleDoc,
          hasMore: hasMoreQuotes,
          processedChunks: updatedChunks,
          timestamp: Date.now(),
        });
        console.log(`💾 Saved first page to cache with key: ${cacheKey}`);
      } else {
        // Not first page - append quotes (never cache these)
        setQuotes((prevQuotes) => {
          const existingIds = new Set(prevQuotes.map((quote) => quote.id));
          const filteredNewQuotes = fetchedQuotes.filter(
            (quote) => !existingIds.has(quote.id)
          );
          console.log(`✅ Added ${filteredNewQuotes.length} more quotes`);
          return [...prevQuotes, ...filteredNewQuotes];
        });
      }

      // Update pagination state
      setLastDoc(lastVisibleDoc);
      setHasMore(hasMoreQuotes);
      setProcessedChunks(updatedChunks);
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

