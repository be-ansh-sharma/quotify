import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons'; // For back button
import Quotes from 'components/quotes/Quotes'; // Reuse the Quotes component
import useUserStore from 'stores/userStore';

export default function FavoriteQuotes() {
  const router = useRouter();
  const user = useUserStore((state) => state.user); // Get the user from the store

  // Check if the user has favorite authors
  const hasfollowedAuthors = user?.followedAuthors?.length > 0;

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/browse')} // Navigate back to the home screen
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite Authors' Quotes</Text>
      </View>

      {/* Conditional Rendering */}
      {hasfollowedAuthors ? (
        <Quotes
          selectedSort='newest' // Default sort order for favorite quotes
          user={user}
          followedAuthors={true} // Fetch quotes by favorite authors
        />
      ) : (
        <View style={styles.noFavoritesContainer}>
          <Text style={styles.noFavoritesText}>
            You are not following any authors yet. Start following authors to
            see their quotes here!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Use the app's background color
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text, // Use a contrasting color for the text
  },
  noFavoritesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  noFavoritesText: {
    fontSize: 16,
    color: COLORS.placeholder,
    textAlign: 'center',
  },
});

