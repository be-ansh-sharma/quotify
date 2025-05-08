import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchTags } from 'utils/firebase/firestore'; // Function to fetch tags
import { COLORS } from 'styles/theme';
import Header from 'components/header/Header'; // Import the reusable Header component

export default function Tags() {
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [lastDoc, setLastDoc] = useState(null); // Track the last document for pagination
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [scale] = useState(new Animated.Value(1)); // Animation value for scaling

  // Fetch tags from the database
  const loadTags = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const { newTags, lastVisibleDoc, hasMoreTags } = await fetchTags(lastDoc);

      setTags((prevTags) => [...prevTags, ...newTags]);
      setLastDoc(lastVisibleDoc);
      setHasMore(hasMoreTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags(); // Load tags when the component mounts
  }, []);

  const renderTile = ({ item }) => {
    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.95,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity
        style={styles.tile}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push(`/tags/${encodeURIComponent(item.name)}`)} // Navigate to the tag's page
      >
        <Animated.View
          style={[
            styles.tileContent,
            {
              transform: [{ scale: scale }],
            },
          ]}
        >
          <Text style={styles.tileText}>#{item.name}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator size='large' style={{ marginVertical: 20 }} />;
  };

  return (
    <View style={styles.container}>
      {/* Use the reusable Header component */}
      <Header title='Tags' backRoute='/browse' />

      {/* Tags List */}
      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        renderItem={renderTile}
        numColumns={2} // Display 2 tiles per row
        columnWrapperStyle={styles.row} // Style for rows
        contentContainerStyle={styles.grid} // Style for the grid
        onEndReached={loadTags} // Load more tags when the user scrolls to the end
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  grid: {
    justifyContent: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginTop: 16,
  },
  tile: {
    flex: 1,
    marginHorizontal: 8,
    aspectRatio: 1, // Make tiles square
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
});

