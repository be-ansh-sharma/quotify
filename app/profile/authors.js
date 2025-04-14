import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons';

export default function FavoriteAuthors() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isGuest = useUserStore((state) => state.isGuest);

  const renderEmptyState = (message) => (
    <View style={styles.emptyContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite Authors</Text>
      </View>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  const renderAuthor = ({ item }) => (
    <TouchableOpacity
      style={styles.authorTile}
      onPress={() => router.push(`/authors/${item.id}`)} // Navigate to the author's quotes
    >
      <Text style={styles.authorName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (isGuest) {
    return renderEmptyState('Login to follow your favorite authors.');
  }

  if (!user?.followedAuthors?.length) {
    return renderEmptyState("You haven't followed any authors yet.");
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite Authors</Text>
      </View>

      {/* List of Favorite Authors */}
      <FlatList
        data={user.followedAuthors} // Use authors directly from the user store
        keyExtractor={(item) => item.id}
        renderItem={renderAuthor}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Use the app's background color
  },
  header: {
    width: '100%', // Ensure the header occupies the full width
    flexDirection: 'row',
    alignItems: 'center', // Align items vertically in the center of the header
    justifyContent: 'space-between', // Space between back button and title
    padding: 16,
    backgroundColor: COLORS.primary, // Use the app's primary color for the header
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text, // Use a contrasting color for the text
    flex: 1, // Allow the title to take up available space
    textAlign: 'center', // Center the title text
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Align content to the top
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.placeholder,
    textAlign: 'center',
    marginTop: 20, // Add spacing below the header
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  authorTile: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

