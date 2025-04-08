import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';

export default function FavoriteAuthors() {
  const router = useRouter();
  const user = useUserStore((state) => state.user); // Get the user from the store
  const favoriteAuthors = user?.followedAuthors || []; // Get the list of favorite authors

  const renderAuthorTile = ({ item }) => (
    <TouchableOpacity
      style={styles.tile}
      onPress={() => router.push(`/authors/${encodeURIComponent(item)}`)} // Navigate to the author's page
    >
      <Text style={styles.tileText}>{item}</Text>
    </TouchableOpacity>
  );

  if (favoriteAuthors.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          You haven't followed any authors yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteAuthors}
        keyExtractor={(item) => item}
        renderItem={renderAuthorTile}
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
  emptyText: {
    fontSize: 18,
    color: COLORS.placeholder,
    textAlign: 'center',
    marginTop: 20,
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
    color: COLORS.onPrimary,
    textAlign: 'center',
  },
});
