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

  // Add initialLoadRef to track first load
  const initialLoadRef = useRef(false);

  // Generate styles with current theme colors
  const styles = getStyles(COLORS);

  // Fetch tags from the database with isReset parameter
  const loadTags = async (isReset = false) => {
    if (loading || (!hasMore && !isReset) || searchQuery.trim()) return;

    setLoading(true);
    try {
      // If this is a reset but we already have tags data, just use what we have
      if (isReset && tags.length > 0 && initialLoadRef.current) {
        console.log('Using cached tags data');
        setLoading(false);
        return;
      }

      const { newTags, lastVisibleDoc, hasMoreTags } = await fetchTags(
        isReset ? null : lastDoc
      );

      // Mark that we've loaded data
      initialLoadRef.current = true;

      // Filter out any duplicate tags
      setTags((prevTags) => {
        // If this is a reset, don't append to existing tags
        if (isReset) return newTags;

        // Create a map of existing tags by ID for quick lookup
        const existingTagsMap = new Map(prevTags.map((tag) => [tag.id, true]));

        // Only add tags that don't already exist
        const uniqueNewTags = newTags.filter(
          (tag) => !existingTagsMap.has(tag.id)
        );

        return [...prevTags, ...uniqueNewTags];
      });

      setLastDoc(lastVisibleDoc);
      setHasMore(hasMoreTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
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
        // Only add if we don't already have this ID or name
        const key = tag.id || tag.name;
        if (!uniqueTagsMap.has(key)) {
          uniqueTagsMap.set(key, tag);
        }
      });

      // Convert Map back to array
      const uniqueTags = Array.from(uniqueTagsMap.values());

      setTags(uniqueTags);
      setHasMore(false); // No pagination for search results
    } catch (error) {
      console.error('Error searching tags:', error);
    } finally {
      setLoading(false);
      setIsSearching(false);
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
    loadTags(true); // Load tags with reset flag when component mounts
  }, []);

  // Clear search and reset to browse mode - don't reload if we have data
  const clearSearch = () => {
    setSearchQuery('');

    // Don't clear data and reload if we already have tags
    if (tags.length === 0) {
      setLastDoc(null);
      setHasMore(true);
      loadTags(true); // Pass true to indicate this is a reset
    }
  };

  // Update the TagTile component to better center content
  const TagTile = React.memo(({ item, index }) => {
    // Use item id or index as seed for consistent icons per tag
    const iconSeed = parseInt(item.id, 36) || index * 100;

    // Animation values
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
          {/* TileDecoration as background */}
          <TileDecoration seed={iconSeed} />

          {/* Centered content wrapper */}
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
      </View>
    );
  };

  // Empty results message
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
        onEndReached={searchQuery ? null : loadTags}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyList}
      />
    </View>
  );
}

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
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

