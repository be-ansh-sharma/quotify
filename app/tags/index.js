import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { fetchTags } from 'utils/firebase/firestore'; // Function to fetch tags
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome for the back icon

export default function Tags() {
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [lastDoc, setLastDoc] = useState(null); // Track the last document for pagination
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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

  // Handle back button press to navigate to the browse screen
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.replace('/browse'); // Navigate back to the browse screen
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove(); // Cleanup the event listener
    }, [router])
  );

  useEffect(() => {
    loadTags(); // Load tags when the component mounts
  }, []);

  const renderTile = ({ item }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => router.push(`/tags/${encodeURIComponent(item.name)}`)} // Navigate to the tag's page
    >
      <Text style={styles.tileText}>#{item.name}</Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator size='large' style={{ marginVertical: 20 }} />;
  };

  return (
    <View style={styles.container}>
      {/* Banner Section */}
      <View style={styles.banner}>
        <TouchableOpacity
          onPress={() => router.replace('/browse')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.bannerText}>Tags</Text>
      </View>

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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    marginRight: 12,
  },
  bannerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.onSurface,
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
  tileText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
});

