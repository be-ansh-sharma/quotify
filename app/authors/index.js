import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchAuthors, searchAuthors } from 'utils/firebase/firestore'; // Add searchAuthors import
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header';
import TileDecoration from 'components/decoration/TileDecoration';
import { FontAwesome } from '@expo/vector-icons'; // Add this import for search icon

export default function Authors() {
  const router = useRouter();
  const [authors, setAuthors] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // Add search query state
  const [isSearching, setIsSearching] = useState(false); // Add searching state

  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

  // Add new ref to track initial load
  const initialLoadRef = useRef(false);

  // Fetch authors from the database
  const loadAuthors = async (isReset = false) => {
    // Don't fetch if already loading or no more to load
    if (loading || (!hasMore && !isReset) || searchQuery.trim()) return;

    setLoading(true);
    try {
      // If this is a reset (from clearSearch) but we've already loaded data,
      // just reset the UI without fetching again
      if (isReset && authors.length > 0 && initialLoadRef.current) {
        console.log('Using cached authors data');
        setLoading(false);
        return;
      }

      const { newAuthors, lastVisibleDoc, hasMoreAuthors } = await fetchAuthors(
        isReset ? null : lastDoc
      );

      // Mark that we've done our initial load
      initialLoadRef.current = true;

      // Filter out duplicates
      setAuthors((prevAuthors) => {
        // If this is a reset, don't append to existing authors
        if (isReset) return newAuthors;

        const existingAuthorsMap = new Map(
          prevAuthors.map((author) => [author.id, true])
        );
        const uniqueNewAuthors = newAuthors.filter(
          (author) => !existingAuthorsMap.has(author.id)
        );
        return [...prevAuthors, ...uniqueNewAuthors];
      });

      setLastDoc(lastVisibleDoc);
      setHasMore(hasMoreAuthors);
    } catch (error) {
      console.error('Error fetching authors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Perform search operation
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    setLoading(true);

    try {
      const results = await searchAuthors(searchQuery);

      // Create a Map to filter duplicates by ID
      const uniqueAuthorsMap = new Map();
      results.forEach((author) => {
        const key = author.id || author.name;
        if (!uniqueAuthorsMap.has(key)) {
          uniqueAuthorsMap.set(key, author);
        }
      });

      // Convert Map back to array
      const uniqueAuthors = Array.from(uniqueAuthorsMap.values());

      setAuthors(uniqueAuthors);
      setHasMore(false); // No pagination for search results
    } catch (error) {
      console.error('Error searching authors:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Clear search and reset to browse mode
  const clearSearch = () => {
    setSearchQuery('');

    // Don't clear data and reload if we already have authors
    if (authors.length === 0) {
      setLastDoc(null);
      setHasMore(true);
      loadAuthors(true); // Pass true to indicate this is a reset
    }
  };

  // Handle search with debounce
  useEffect(() => {
    // Skip the initial render effect for empty search query
    if (searchQuery === '' && !initialLoadRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else if (searchQuery === '') {
        clearSearch();
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial load - only runs once
  useEffect(() => {
    loadAuthors(true); // Load authors with reset flag when the component mounts
  }, []);

  // Empty results message
  const renderEmptyList = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        {searchQuery ? (
          <>
            <Text style={styles.emptyText}>
              No authors found for "{searchQuery}"
            </Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>Clear search</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.emptyText}>No authors available</Text>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Use the reusable Header component */}
      <Header title='Authors' backRoute='/browse' />

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <FontAwesome
            name='search'
            size={16}
            color={COLORS.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder='Search authors...'
            placeholderTextColor={COLORS.onBackground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <FontAwesome
                name='times-circle'
                size={16}
                color={COLORS.onBackground}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Authors List */}
      <FlatList
        data={authors}
        keyExtractor={(item, index) =>
          item.id ? `${item.id}_${index}` : `author_${index}`
        }
        renderItem={({ item }) => (
          <AuthorTile item={item} router={router} styles={styles} />
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.grid,
          authors.length === 0 && styles.emptyGrid,
        ]}
        onEndReached={searchQuery ? null : loadAuthors}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyList}
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
    // Search related styles
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 20,
      paddingHorizontal: 16,
      height: 42,
      borderWidth: 1,
      backgroundColor: COLORS.surface,
      borderColor: COLORS.border,
    },
    searchIcon: {
      marginRight: 8,
      color: COLORS.onBackground,
    },
    searchInput: {
      flex: 1,
      height: 40,
      fontSize: 16,
      color: COLORS.text,
    },
    // Existing grid styles
    grid: {
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingBottom: 20,
    },
    emptyGrid: {
      flexGrow: 1,
    },
    row: {
      flexWrap: 'wrap',
      justifyContent: 'space-around',
    },
    // Existing tile styles
    tile: {
      flex: 1,
      marginHorizontal: 8,
      aspectRatio: 1,
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
      overflow: 'hidden',
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
      zIndex: 2,
    },
    decorations: {
      position: 'absolute',
      top: -10,
      left: -10,
      right: -10,
      bottom: -10,
      zIndex: 1,
    },
    // Empty state styles
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    emptyText: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 16,
      color: COLORS.textSecondary,
    },
    clearButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: COLORS.primary,
    },
    clearButtonText: {
      fontWeight: '600',
      color: COLORS.white,
    },
    // Loading indicator
    footer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });

