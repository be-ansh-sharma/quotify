import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router'; // Import router for navigation
import { COLORS } from 'styles/theme';
import Quotes from 'components/quotes/Quotes'; // Import the refactored Quotes component
import Sort from 'components/sort/Sort';
import { AUTHOR_SORT_OPTIONS } from 'config/sortConfig';
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome for icons
import useUserStore from 'stores/userStore';
import { followAuthor, unfollowAuthor } from 'utils/firebase/firestore'; // Import Firestore functions

export default function AuthorScreen() {
  const { author } = useLocalSearchParams();
  const decodedAuthor = author ? decodeURIComponent(author) : 'Unknown Author'; // Decode the author name or fallback to 'Unknown Author'

  const [selectedSort, setSelectedSort] = useState('mostPopular'); // Default sort option
  const user = useUserStore((state) => state.user); // Get the user from the store
  const updateUser = useUserStore((state) => state.setUser); // Function to update the user in the store

  const isFollowing = user?.followedAuthors?.includes(decodedAuthor); // Check if the user is already following the author

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        // Unfollow the author
        await unfollowAuthor(user.uid, decodedAuthor);
        updateUser({
          ...user,
          followedAuthors: user.followedAuthors.filter(
            (a) => a !== decodedAuthor
          ),
        });
        Alert.alert('Unfollowed', `You have unfollowed ${decodedAuthor}.`);
      } else {
        // Follow the author
        await followAuthor(user.uid, decodedAuthor);
        updateUser({
          ...user,
          followedAuthors: [...(user.followedAuthors || []), decodedAuthor],
        });
        Alert.alert('Followed', `You are now following ${decodedAuthor}.`);
      }
    } catch (error) {
      console.error('Error toggling follow state:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const sortHandler = (sortOption) => {
    setSelectedSort(sortOption);
  };

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
        <TouchableOpacity onPress={toggleFollow} style={styles.followButton}>
          <FontAwesome
            name={isFollowing ? 'heart' : 'heart-o'} // Filled heart if following, outline if not
            size={20}
            color={isFollowing ? COLORS.liked : COLORS.onSurface}
          />
        </TouchableOpacity>
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
    justifyContent: 'space-between', // Space between back button, title, and follow button
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
    flex: 1, // Take up remaining space
  },
  followButton: {
    marginLeft: 12,
  },
});

