import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router'; // Import router for navigation
import { useAppTheme } from 'context/AppThemeContext';
import Quotes from 'components/quotes/Quotes';
import Sort from 'components/sort/Sort';
import { AUTHOR_SORT_OPTIONS } from 'config/sortConfig';
import Header from 'components/header/Header'; // Import the reusable Header component
import useUserStore from 'stores/userStore';
import { followAuthor, unfollowAuthor } from 'utils/firebase/firestore'; // Import Firestore functions

export default function AuthorScreen() {
  const { author } = useLocalSearchParams();
  const decodedAuthor = author ? decodeURIComponent(author) : 'Unknown Author'; // Decode the author name or fallback to 'Unknown Author'

  const [selectedSort, setSelectedSort] = useState('mostPopular'); // Default sort option
  const user = useUserStore((state) => state.user); // Get the user from the store
  const updateUser = useUserStore((state) => state.setUser); // Function to update the user in the store

  const isFollowing = user?.followedAuthors?.includes(decodedAuthor); // Check if the user is already following the author

  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

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
      {/* Use the reusable Header component */}
      <Header
        title={decodedAuthor}
        backRoute='/authors'
        rightIcon={isFollowing ? 'heart' : 'heart-outline'}
        rightAction={toggleFollow}
        rightIconColor={isFollowing ? COLORS.liked : COLORS.onSurface}
      />

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

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
  });

