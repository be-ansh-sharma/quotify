import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { fetchQuotes } from 'utils/firebase/firestore'; // Import the Firestore logic
import Tile from './tile/Tile';

export default Quotes = ({ selectedSort }) => {
  const [quotes, setQuotes] = useState([]);
  const [lastDoc, setLastDoc] = useState(null); // Track the last document for pagination
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadQuotes = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const { newQuotes, lastVisibleDoc, hasMoreQuotes } = await fetchQuotes(
        lastDoc,
        selectedSort
      );

      // Ensure no duplicate quotes are added
      setQuotes((prevQuotes) => {
        const existingIds = new Set(prevQuotes.map((quote) => quote.id));
        const filteredNewQuotes = newQuotes.filter(
          (quote) => !existingIds.has(quote.id)
        );
        return [...prevQuotes, ...filteredNewQuotes];
      });

      setLastDoc(lastVisibleDoc);
      setHasMore(hasMoreQuotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset and fetch quotes when sort order changes
    setQuotes([]);
    setLastDoc(null);
    setHasMore(true);
    loadQuotes();
  }, [selectedSort]);

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator size='large' style={{ marginVertical: 20 }} />;
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Tile quote={item} />}
        onEndReached={loadQuotes}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        decelerationRate='normal'
        scrollEventThrottle={16}
      />
    </View>
  );
};

