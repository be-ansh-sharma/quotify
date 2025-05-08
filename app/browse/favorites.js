import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from 'styles/theme';
import Quotes from 'components/quotes/Quotes'; // Reuse the Quotes component
import useUserStore from 'stores/userStore';
import Header from 'components/header/Header'; // Import the reusable Header component

export default function FavoriteQuotes() {
  const router = useRouter();
  const user = useUserStore((state) => state.user); // Get the user from the store

  // Check if the user has favorite authors
  const hasFollowedAuthors = user?.followedAuthors?.length > 0;

  return (
    <View style={styles.container}>
      {/* Use the reusable Header component */}
      <Header title="Favorite Authors' Quotes" backRoute='/browse' />

      {/* Conditional Rendering */}
      {hasFollowedAuthors ? (
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

