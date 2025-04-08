import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from 'styles/theme';

const categories = [
  { id: '1', title: 'Authors', route: '/authors' },
  { id: '2', title: 'Tags', route: '/tags' },
  { id: '3', title: 'Popular Quotes', route: '/popular' },
  { id: '4', title: 'Newest Quotes', route: '/newest' },
];

export default function Browse() {
  const router = useRouter();

  const renderTile = ({ item }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => router.push(item.route)} // Ensure router.push is used
    >
      <Text style={styles.tileText}>{item.title}</Text>
    </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  grid: {
    justifyContent: 'center',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
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

