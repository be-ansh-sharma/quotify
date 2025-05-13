import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchAuthors } from 'utils/firebase/firestore'; // Function to fetch authors
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header'; // Import the reusable Header component
import TileDecoration from 'components/decoration/TileDecoration'; // Add decorative icons

export default function Authors() {
  const router = useRouter();
  const [authors, setAuthors] = useState([]);
  const [lastDoc, setLastDoc] = useState(null); // Track the last document for pagination
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

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

  useEffect(() => {
    loadAuthors(); // Load authors when the component mounts
  }, []);

  const renderTile = ({ item }) => {
    return <AuthorTile item={item} router={router} styles={styles} />;
  };

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator size='large' style={{ marginVertical: 20 }} />;
  };

  return (
    <View style={styles.container}>
      {/* Use the reusable Header component */}
      <Header title='Authors' backRoute='/browse' />

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

const AuthorTile = ({ item, router, styles }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  // Create a more unique seed
  const seed = parseInt(item.id, 36) * 100 + item.name.length * 7;

  return (
    <TouchableOpacity
      style={styles.tile}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => router.push(`/authors/${encodeURIComponent(item.name)}`)}
    >
      <Animated.View
        style={[
          styles.tileContent,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Background decorations - significantly reduced icon count and larger area */}
        <TileDecoration
          size={130} // Increase size to give more room
          seed={seed}
          iconCount={6} // Reduce to just 3 icons
          opacity={0.15}
          style={styles.decorations}
        />
        <Text style={styles.tileText}>{item.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    grid: {
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingBottom: 20,
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
      borderRadius: 15,
      elevation: 6,
      shadowColor: COLORS.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      paddingHorizontal: 12,
      marginBottom: 16,
      overflow: 'hidden', // Ensure decorations don't overflow
    },
    tileContent: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    tileText: {
      fontSize: 18,
      fontWeight: '600',
      color: COLORS.text,
      textAlign: 'center',
      zIndex: 2, // Ensure text stays on top
    },
    decorations: {
      position: 'absolute',
      top: -10, // Extend beyond the tile edges
      left: -10,
      right: -10,
      bottom: -10,
      zIndex: 1,
    },
  });

