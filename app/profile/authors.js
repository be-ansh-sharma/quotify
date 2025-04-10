import React from 'react';
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
import { FontAwesome } from '@expo/vector-icons'; // For back button

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
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <FontAwesome name='arrow-left' size={20} color={COLORS.onPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favorite Authors</Text>
        </View>

        <Text style={styles.emptyText}>
          You haven't followed any authors yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite Authors</Text>
      </View>

      {/* Favorite Authors Grid */}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.primary, // Use the app's primary color for the header
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text, // Use a contrasting color for the text
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
    color: COLORS.text,
    textAlign: 'center',
  },
});

