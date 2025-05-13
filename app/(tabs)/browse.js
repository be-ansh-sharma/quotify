import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from 'context/AppThemeContext';

const categories = [
  { id: '1', title: 'Authors', route: '/authors' },
  { id: '2', title: 'Tags', route: '/tags' },
  { id: '3', title: 'Popular Quotes', route: '/browse/popular' },
  { id: '4', title: 'Newest Quotes', route: '/browse/new' },
  { id: '5', title: 'Followed Authors Quotes', route: '/browse/favorites' },
  {
    id: '7',
    title: 'User-Generated Quotes',
    route: '/browse/userquotes',
  },
  { id: '8', title: 'Book Quotes', route: '/books', comingsoon: true },
  { id: '9', title: 'Movie Quotes', route: '/movies', comingsoon: true },
  {
    id: '10',
    title: 'Celebrity Quotes',
    route: '/celebrities',
    comingsoon: true,
  },
];

export default function Browse() {
  const router = useRouter();

  const { COLORS } = useAppTheme();

  const styles = getStyles(COLORS);

  const renderTile = ({ item }) => (
    <View style={styles.tileContainer}>
      <TouchableOpacity
        style={[
          styles.tile,
          item.comingsoon && styles.comingSoonTile, // Apply different style for coming soon tiles
        ]}
        onPress={() => !item.comingsoon && router.push(item.route)} // Disable navigation for coming soon items
        activeOpacity={item.comingsoon ? 1 : 0.85} // Disable click effect for coming soon items
      >
        <Text style={styles.tileText}>{item.title}</Text>
        {item.comingsoon && (
          <Text style={styles.comingSoonLabel}>Coming Soon</Text> // Add "Coming Soon" label
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderTile}
        numColumns={2} // Display 2 tiles per row
        columnWrapperStyle={styles.row} // Style for rows
        contentContainerStyle={styles.grid} // Style for the grid
      />
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      padding: 8,
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
    tile: {
      flex: 1,
      aspectRatio: 1, // Make tiles square
      backgroundColor: COLORS.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 15, // Slightly rounded for a softer look
      shadowColor: COLORS.shadow,
      shadowOpacity: 0.2, // Slightly stronger shadow for depth
      shadowRadius: 8, // Increased shadow radius for a more noticeable effect
      shadowOffset: { width: 0, height: 4 }, // Slightly offset shadow for a more realistic appearance
      elevation: 4, // Android shadow effect
    },
    comingSoonTile: {
      backgroundColor: COLORS.placeholder, // Dimmed background for coming soon tiles
    },
    tileText: {
      fontSize: 18, // Increased text size for better visibility
      fontWeight: '600', // Semi-bold for better emphasis
      color: COLORS.text,
      textAlign: 'center',
      paddingHorizontal: 10, // Padding for better text spacing
    },
    comingSoonLabel: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '500',
      color: COLORS.onSurface,
      textAlign: 'center',
    },
  });

