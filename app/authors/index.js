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
import { fetchAuthors, searchAuthors } from 'utils/firebase/firestore';
import { AuthorsCache } from 'utils/cache/authorsCache'; // Import the cache utility
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header';
import TileDecoration from 'components/decoration/TileDecoration';
import { FontAwesome } from '@expo/vector-icons';

export default function Authors() {
  const router = useRouter();
  const [authors, setAuthors] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the first load

  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

  // Add new ref to track initial load
  const initialLoadRef = useRef(false);
  const cacheLoadedRef = useRef(false); // Track if we've loaded from cache

  // Load authors from cache first, then remote if needed
  const loadAuthorsWithCache = async () => {
    try {
      setLoading(true);

      // Try to load from cache first
      const cacheResult = await AuthorsCache.loadAuthors();

      if (cacheResult && cacheResult.authors.length > 0) {
        // We have valid cached data
        setAuthors(cacheResult.authors);

        // DON'T set the cached lastDoc - it's not a valid Firestore reference
        // Instead, reset lastDoc to null so pagination starts fresh
        setLastDoc(null);

        cacheLoadedRef.current = true;
        initialLoadRef.current = true;
        setIsInitialLoad(false);

        console.log('Loaded authors from cache, resetting pagination');

        // Always enable hasMore for cached data to allow pagination
        setHasMore(true);
      } else {
        // No cache or expired cache, load from remote
        console.log('No valid cache, loading from remote');
        await loadAuthorsFromRemote(true);
      }
    } catch (error) {
      console.error('Error loading authors with cache:', error);
      // Fallback to remote loading
      await loadAuthorsFromRemote(true);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Load authors from remote (Firestore)
  const loadAuthorsFromRemote = async (isReset = false) => {
    // Prevent multiple simultaneous requests
    if (loading && !isReset) return;

    // Don't load if no more data available (unless resetting)
    if (!hasMore && !isReset) return;

    // Don't load during search (unless resetting)
    if (isSearching && !isReset) return;

    setLoading(true);
    try {
      // If we loaded from cache and this is the first remote call,
      // we need to skip the cached items
      let startAfterDoc = lastDoc;

      // If we have cached data but no valid lastDoc, we need to find where to start
      if (cacheLoadedRef.current && !lastDoc && authors.length > 0) {
        console.log('Finding pagination start point after cache...');
        // Get the last author from cache to determine where to start pagination
        const lastCachedAuthor = authors[authors.length - 1];

        // We'll need to create a query that starts after this author
        // For now, let's use a different approach - skip the cached count
        const { newAuthors, lastVisibleDoc, hasMoreAuthors } =
          await fetchAuthors(
            null,
            authors.length // cacheSize parameter
          );

        // Filter out any authors we already have
        const existingIds = new Set(authors.map((author) => author.id));
        const uniqueNewAuthors = newAuthors.filter(
          (author) => !existingIds.has(author.id)
        );

        setAuthors((prevAuthors) => [...prevAuthors, ...uniqueNewAuthors]);
        setLastDoc(lastVisibleDoc);
        setHasMore(hasMoreAuthors);

        console.log(
          `Loaded ${uniqueNewAuthors.length} new authors after cache, hasMore: ${hasMoreAuthors}`
        );
      } else {
        // Normal pagination
        const { newAuthors, lastVisibleDoc, hasMoreAuthors } =
          await fetchAuthors(isReset ? null : lastDoc);

        initialLoadRef.current = true;

        setAuthors((prevAuthors) => {
          // Filter out duplicates
          const existingIds = new Set(prevAuthors.map((author) => author.id));
          const uniqueNewAuthors = newAuthors.filter(
            (author) => !existingIds.has(author.id)
          );

          const updatedAuthors = isReset
            ? newAuthors
            : [...prevAuthors, ...uniqueNewAuthors];

          // Cache the data if this is the first page or we're resetting
          if (isReset || !cacheLoadedRef.current) {
            AuthorsCache.saveAuthors(updatedAuthors, lastVisibleDoc);
          }

          return updatedAuthors;
        });

        setLastDoc(lastVisibleDoc);
        setHasMore(hasMoreAuthors);

        console.log(
          `Loaded ${newAuthors.length} authors from remote, hasMore: ${hasMoreAuthors}`
        );
      }
    } catch (error) {
      console.error('Error fetching authors from remote:', error);
    } finally {
      setLoading(false);
    }
  };

  // Main load function that handles both cache and remote loading
  const loadAuthors = async (isReset = false) => {
    // Don't load if already loading, searching, or no more data (unless resetting)
    if (loading || isSearching || (!hasMore && !isReset)) return;

    // For initial load, try cache first
    if (isReset && isInitialLoad) {
      await loadAuthorsWithCache();
    } else {
      // For pagination or when cache is not available, load from remote
      await loadAuthorsFromRemote(isReset);
    }
  };

  // Perform search operation (unchanged)
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    setLoading(true);

    try {
      const results = await searchAuthors(searchQuery);

      const uniqueAuthorsMap = new Map();
      results.forEach((author) => {
        const key = author.id || author.name;
        if (!uniqueAuthorsMap.has(key)) {
          uniqueAuthorsMap.set(key, author);
        }
      });

      const uniqueAuthors = Array.from(uniqueAuthorsMap.values());

      setAuthors(uniqueAuthors);
      setLastDoc(null);
      setHasMore(false);
    } catch (error) {
      console.error('Error searching authors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear search and reset to browse mode
  const clearSearch = async () => {
    setSearchQuery('');
    setIsSearching(false);
    setLastDoc(null);
    setHasMore(true);

    // When clearing search, try to load from cache again
    setIsInitialLoad(true);
    cacheLoadedRef.current = false;
    initialLoadRef.current = false; // Reset this flag too
    await loadAuthorsWithCache();
  };

  // Handle search with debounce (unchanged)
  useEffect(() => {
    if (searchQuery === '' && !initialLoadRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else if (searchQuery === '') {
        clearSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial load - load with cache
  useEffect(() => {
    loadAuthors(true);
  }, []);

  // Debug function to check cache info (remove in production)
  const debugCacheInfo = async () => {
    const info = await AuthorsCache.getCacheInfo();
    console.log('Cache Info:', info);
  };

  // Empty results message (unchanged)
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
        {/* Show different text for initial load vs pagination */}
        <Text style={styles.footerText}>
          {isInitialLoad ? 'Loading authors...' : 'Loading more...'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title='Authors' backRoute='/browse' />

      {/* Add cache debug button in development */}
      {__DEV__ && (
        <TouchableOpacity onPress={debugCacheInfo} style={styles.debugButton}>
          <Text>Debug Cache</Text>
        </TouchableOpacity>
      )}

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
        onEndReached={() => {
          // Only load more if we're not searching and not on initial load
          if (
            !isSearching &&
            !searchQuery.trim() &&
            !isInitialLoad &&
            hasMore
          ) {
            console.log('Loading more authors...');
            loadAuthors(false); // This will call loadAuthorsFromRemote(false)
          }
        }}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyList}
      />
    </View>
  );
}

// AuthorTile component (unchanged)
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
        <TileDecoration
          size={130}
          seed={seed}
          iconCount={6}
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
    // Debug button (remove in production)
    debugButton: {
      position: 'absolute',
      top: 100,
      right: 10,
      zIndex: 1000,
      backgroundColor: 'red',
      padding: 10,
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
    // Grid styles
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
    // Tile styles
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
    footerText: {
      marginTop: 8,
      fontSize: 14,
      color: COLORS.textSecondary,
    },
  });

