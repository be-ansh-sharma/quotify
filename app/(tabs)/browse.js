import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from 'context/AppThemeContext';
import { Ionicons } from '@expo/vector-icons';
import TileDecoration from 'components/decoration/TileDecoration';

// Add icons for each category
const categories = [
  { id: '1', title: 'Authors', route: '/authors', icon: 'people-outline' },
  { id: '2', title: 'Tags', route: '/tags', icon: 'pricetags-outline' },
  {
    id: '3',
    title: 'Popular Quotes',
    route: '/browse/popular',
    icon: 'star-outline',
  },
  {
    id: '4',
    title: 'Newest Quotes',
    route: '/browse/new',
    icon: 'time-outline',
  },
  {
    id: '5',
    title: 'Followed Authors',
    route: '/browse/favorites',
    icon: 'heart-outline',
  },
  {
    id: '7',
    title: 'User Quotes',
    route: '/browse/userquotes',
    icon: 'create-outline',
  },
];

// Get screen width to calculate tile size
const { width: screenWidth } = Dimensions.get('window');
const tileSize = (screenWidth - 48) / 2; // 48 = padding (16) + margin (8*4)

export default function Browse() {
  const router = useRouter();
  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  const renderTile = ({ item }) => {
    return <CategoryTile item={item} router={router} styles={styles} />;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderTile}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const CategoryTile = ({ item, router, styles }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const seed = parseInt(item.id) * 100;

  return (
    <View style={styles.tileContainer}>
      <TouchableOpacity
        style={[styles.tileWrapper]}
        activeOpacity={item.comingsoon ? 1 : 0.95}
        onPressIn={!item.comingsoon ? handlePressIn : undefined}
        onPressOut={!item.comingsoon ? handlePressOut : undefined}
        onPress={() => !item.comingsoon && router.push(item.route)}
      >
        <Animated.View
          style={[
            styles.tile,
            item.comingsoon && styles.comingSoonTile,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Background decorations */}
          <TileDecoration
            size={tileSize - 24}
            seed={seed}
            iconCount={5}
            opacity={0.15}
            style={styles.decorations}
          />

          <View style={styles.iconContainer}>
            <Ionicons
              name={item.icon}
              size={28}
              color={
                item.comingsoon
                  ? styles.comingSoonLabel.color
                  : styles.tileText.color
              }
            />
          </View>
          <Text style={styles.tileText}>{item.title}</Text>
          {item.comingsoon && (
            <Text style={styles.comingSoonLabel}>Coming Soon</Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      padding: 16,
    },
    grid: {
      justifyContent: 'center',
      paddingBottom: 20,
    },
    row: {
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    tileContainer: {
      flex: 1,
      marginHorizontal: 8,
    },
    tileWrapper: {
      flex: 1,
      aspectRatio: 1,
    },
    tile: {
      flex: 1,
      backgroundColor: COLORS.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 18,
      padding: 12,
      shadowColor: COLORS.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
      overflow: 'hidden',
    },
    decorations: {
      position: 'absolute',
      top: 12,
      left: 12,
    },
    iconContainer: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 50,
      backgroundColor: COLORS.surfaceVariant,
    },
    comingSoonTile: {
      backgroundColor: COLORS.surfaceVariant,
      opacity: 0.8,
    },
    tileText: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.text,
      textAlign: 'center',
      paddingHorizontal: 10,
    },
    comingSoonLabel: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '500',
      color: COLORS.onSurface,
      textAlign: 'center',
      backgroundColor: COLORS.surfaceVariant,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
    },
  });

