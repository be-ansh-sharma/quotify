import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchTags, searchTags } from 'utils/firebase/firestore';
import { TagsCache } from 'utils/cache/tagsCache'; // Import the cache utility
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header';
import TileDecoration from 'components/decoration/TileDecoration';
import { FontAwesome } from '@expo/vector-icons';

// Calculate tile size based on screen width
const { width: screenWidth } = Dimensions.get('window');
const tileSize = (screenWidth - 40) / 2; // Accounting for margins

export default function Tags() {
  const router = useRouter();
  const { COLORS } = useAppTheme();
  const [tags, setTags] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Add refs to track cache and initial load
  const initialLoadRef = useRef(false);
  const cacheLoadedRef = useRef(false);

  // Generate styles with current theme colors
  const styles = getStyles(COLORS);

  // Load tags from cache first, then remote if needed
  const loadTagsWithCache = async () => {
    try {
      setLoading(true);

      // Try to load from cache first
      const cacheResult = await TagsCache.loadTags();

      if (cacheResult && cacheResult.tags.length > 0) {
        // We have valid cached data
        setTags(cacheResult.tags);

        // Reset pagination state - start fresh for next batch
        setLastDoc(null);

        cacheLoadedRef.current = true;
        initialLoadRef.current = true;
        setIsInitialLoad(false);

        console.log(`Loaded ${cacheResult.tags.length} tags from cache`);

        // Enable pagination from where cache left off
        setHasMore(true);
      } else {
        console.log('No valid cache, loading from remote');
        await loadTagsFromRemote(true);
      }
    } catch (error) {
      console.error('Error loading tags with cache:', error);
      await loadTagsFromRemote(true);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Load tags from remote (Firestore)
  const loadTagsFromRemote = async (isReset = false) => {
    if (loading && !isReset) return;

    if (!hasMore && !isReset) return;

    if (isSearching && !isReset) return;

    setLoading(true);
    try {
      // If we have cached data but no valid lastDoc, we need to skip cached items
      if (cacheLoadedRef.current && !lastDoc && tags.length > 0 && !isReset) {
        console.log('Loading more tags after cache...');
        // Use offset to skip cached items
        const { newTags, lastVisibleDoc, hasMoreTags } = await fetchTags(
          null,
          tags.length // cacheSize parameter
        );

        // Filter out any tags we already have
        const existingIds = new Set(tags.map((tag) => tag.id));
        const uniqueNewTags = newTags.filter((tag) => !existingIds.has(tag.id));

        setTags((prevTags) => [...prevTags, ...uniqueNewTags]);
        setLastDoc(lastVisibleDoc);
        setHasMore(hasMoreTags);

        console.log(
          `Loaded ${uniqueNewTags.length} new tags after cache, hasMore: ${hasMoreTags}`
        );
      } else {
        // Normal pagination or initial load
        const { newTags, lastVisibleDoc, hasMoreTags } = await fetchTags(
          isReset ? null : lastDoc
        );

        initialLoadRef.current = true;

        setTags((prevTags) => {
          // Filter out duplicates
          const existingIds = new Set(prevTags.map((tag) => tag.id));
          const uniqueNewTags = newTags.filter(
            (tag) => !existingIds.has(tag.id)
          );

          const updatedTags = isReset
            ? newTags
            : [...prevTags, ...uniqueNewTags];

          // Cache the data if this is the first page or we're resetting
          if (isReset || !cacheLoadedRef.current) {
            TagsCache.saveTags(updatedTags);
          }

          return updatedTags;
        });

        setLastDoc(lastVisibleDoc);
        setHasMore(hasMoreTags);

        console.log(
          `Loaded ${newTags.length} tags from remote, hasMore: ${hasMoreTags}`
        );
      }
    } catch (error) {
      console.error('Error fetching tags from remote:', error);
    } finally {
      setLoading(false);
    }
  };

  // Main load function that handles both cache and remote loading
  const loadTags = async (isReset = false) => {
    // For initial load, try cache first
    if (isReset && isInitialLoad) {
      await loadTagsWithCache();
    } else {
      // For pagination, always load from remote
      await loadTagsFromRemote(isReset);
    }
  };

  // Perform search
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    setLoading(true);

    try {
      const results = await searchTags(searchQuery);

      // Create a Map to filter duplicates by ID
      const uniqueTagsMap = new Map();
      results.forEach((tag) => {
        const key = tag.id || tag.name;
        if (!uniqueTagsMap.has(key)) {
          uniqueTagsMap.set(key, tag);
        }
      });

      const uniqueTags = Array.from(uniqueTagsMap.values());

      setTags(uniqueTags);
      setLastDoc(null);
      setHasMore(false);
    } catch (error) {
      console.error('Error searching tags:', error);
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
    initialLoadRef.current = false;
    await loadTagsWithCache();
  };

  // Handle search with debounce
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
    loadTags(true);
  }, []);

  // Debug function to check cache info (remove in production)
  const debugCacheInfo = async () => {
    const info = await TagsCache.getCacheInfo();
    console.log('Tags Cache Info:', info);
  };

  // Update the TagTile component (unchanged)
  const TagTile = React.memo(({ item, index }) => {
    const iconSeed = parseInt(item.id, 36) || index * 100;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handlePressOut = () => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return (
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          { margin: 4 },
        ]}
      >
        <TouchableOpacity
          style={styles.tile}
          activeOpacity={0.8}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => router.push(`/tags/${encodeURIComponent(item.name)}`)}
        >
          <TileDecoration seed={iconSeed} />
          <View style={styles.tileContent}>
            <Text style={styles.tileText} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  });

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
        <Text style={styles.footerText}>
          {isInitialLoad ? 'Loading tags...' : 'Loading more...'}
        </Text>
      </View>
    );
  };

  const renderEmptyList = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        {searchQuery ? (
          <>
            <Text style={styles.emptyText}>
              No tags found for "{searchQuery}"
            </Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>Clear search</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.emptyText}>No tags available</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title='Tags' backRoute='/browse' />

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
            placeholder='Search tags...'
            placeholderTextColor={COLORS.onBackground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <FontAwesome
                name='times-circle'
                size={16}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={tags}
        keyExtractor={(item, index) =>
          item.id ? `${item.id}_${index}` : `tag_${index}`
        }
        renderItem={({ item, index }) => <TagTile item={item} index={index} />}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.grid,
          tags.length === 0 && styles.emptyGrid,
        ]}
        onEndReached={() => {
          if (
            !isSearching &&
            !searchQuery.trim() &&
            !isInitialLoad &&
            hasMore
          ) {
            console.log('Loading more tags...');
            loadTags(false);
          }
        }}
        onEndReachedThreshold={0.2}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyList}
      />
    </View>
  );
}

// Convert static styles to a function that takes COLORS (add debug styles)
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
      borderRadius: 5,
    },
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
      color: COLORS.onBackground,
    },
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
    tile: {
      width: tileSize,
      height: tileSize,
      borderRadius: 16,
      padding: 16,
      justifyContent: 'space-between',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: COLORS.surface,
      shadowColor: COLORS.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: COLORS.border || 'transparent',
    },
    tileContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tileText: {
      fontSize: 18,
      fontWeight: '600',
      zIndex: 1,
      color: COLORS.text,
    },
    footer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    footerText: {
      marginTop: 8,
      fontSize: 14,
      color: COLORS.textSecondary,
    },
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
  });

