import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router'; // Import router for navigation
import { COLORS } from 'styles/theme';
import Quotes from 'components/quotes/Quotes'; // Import the refactored Quotes component
import Sort from 'components/sort/Sort';
import { AUTHOR_SORT_OPTIONS } from 'config/sortConfig';
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome for icons
import useUserStore from 'stores/userStore';

export default function AuthorScreen() {
  const { author } = useLocalSearchParams(); // Get the 'author' parameter from the URL
  const decodedAuthor = author ? decodeURIComponent(author) : 'Unknown Author'; // Decode the author name or fallback to 'Unknown Author'

  const [selectedSort, setSelectedSort] = useState('mostPopular'); // Default sort option
  const user = useUserStore((state) => state.user); // Get the user from the store

  const sortHandler = (sortOption) => {
    setSelectedSort(sortOption);
  };

  console.log('userrrr', user);

  return (
    <View style={styles.container}>
      {/* Banner Section */}
      <View style={styles.banner}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.bannerText}>{decodedAuthor}</Text>
      </View>

      {/* Sort Options */}
      <Sort
        selectedSort={selectedSort}
        sortOptions={AUTHOR_SORT_OPTIONS}
        sortHandler={sortHandler}
      />

      {/* Quotes Section */}
      <Quotes selectedSort={selectedSort} user={user} author={decodedAuthor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    marginRight: 12,
  },
  bannerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.onSurface,
  },
});

