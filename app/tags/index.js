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
} from 'react-native';
import { useRouter } from 'expo-router';
import { fetchTags } from 'utils/firebase/firestore';
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header';
import TileDecoration from 'components/decoration/TileDecoration';

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

  const styles = getStyles(COLORS);

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
    loadTags();
  }, []);

  // Separate tile component to handle animations properly
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
          friction: 3,
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
          friction: 3,
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
      <TouchableOpacity
        style={styles.tile}
        activeOpacity={0.8}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push(`/tags/${encodeURIComponent(item.name)}`)}
      >
        {/* Background decorations */}
        <TileDecoration
          size={tileSize - 16} // Subtract padding
          seed={iconSeed}
          iconCount={5} // Number of decorative icons
          opacity={0.1} // Make icons subtle
          style={styles.decorations}
        />

        {/* Main content */}
        <Animated.View
          style={[
            styles.tileContent,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Text style={styles.tileText}>#{item.name}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  });

  const renderTile = ({ item, index }) => {
    return <TagTile item={item} index={index} />;
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
      <Header title='Tags' backRoute='/browse' />

      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        renderItem={renderTile}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        onEndReached={loadTags}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
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
      borderRadius: 12,
      padding: 8,
      shadowColor: COLORS.shadow,
      shadowOpacity: 0.1,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 1 },
      position: 'relative',
      overflow: 'hidden',
    },
    decorations: {
      position: 'absolute',
      top: 8,
      left: 8,
    },
    tileContent: {
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    tileText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: COLORS.text,
      textAlign: 'center',
      padding: 8,
    },
    footer: {
      marginVertical: 20,
      alignItems: 'center',
    },
  });

