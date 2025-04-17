import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { fetchAuthors } from 'utils/firebase/firestore'; // Function to fetch authors
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome for the back icon

export default function Authors() {
  const router = useRouter();
  const [authors, setAuthors] = useState([]);
  const [lastDoc, setLastDoc] = useState(null); // Track the last document for pagination
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [scale] = useState(new Animated.Value(1)); // Animation value for scaling

  // Fetch authors from the database
  const loadAuthors = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const { newAuthors, lastVisibleDoc, hasMoreAuthors } = await fetchAuthors(
        lastDoc
      );

      setAuthors((prevAuthors) => [...prevAuthors, ...newAuthors]);
      setLastDoc(lastVisibleDoc);
      setHasMore(hasMoreAuthors);
    } catch (error) {
      console.error('Error fetching authors:', error);
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
    loadAuthors(); // Load authors when the component mounts
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
        onPress={() => router.push(`/authors/${encodeURIComponent(item.name)}`)} // Navigate to the author's page
      >
        <Animated.View
          style={[
            styles.tileContent,
            {
              transform: [{ scale: scale }],
            },
          ]}
        >
          <Text style={styles.tileText}>{item.name}</Text>
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
      {/* Banner Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/browse')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      {/* Authors List */}
      <FlatList
        data={authors}
        keyExtractor={(item) => item.id}
        renderItem={renderTile}
        numColumns={2} // Display 2 tiles per row
        columnWrapperStyle={styles.row} // Style for rows
        contentContainerStyle={styles.grid} // Style for the grid
        onEndReached={loadAuthors} // Load more authors when the user scrolls to the end
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  grid: {
    justifyContent: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginTop: 8,
  },
  tile: {
    flex: 1,
    marginHorizontal: 8,
    aspectRatio: 1, // Make tiles square
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
});

