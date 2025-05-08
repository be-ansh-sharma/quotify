import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Sort from 'components/sort/Sort';
import Quotes from 'components/quotes/Quotes';
import useUserStore from 'stores/userStore';
import { TAG_SORT_OPTIONS } from 'config/sortConfig';
import { COLORS } from 'styles/theme';
import Header from 'components/header/Header'; // Import the reusable Header component
import { useLocalSearchParams } from 'expo-router';

export default function TagScreen() {
  const { tag } = useLocalSearchParams();
  const storedSort = useUserStore((state) => state.selectedSort);
  const user = useUserStore((state) => state.user); // Get user data from userStore
  const [selectedSort, setSelectedSort] = useState(storedSort);

  const sortHandler = (sort) => {
    setSelectedSort(sort);
    useUserStore.setState({ selectedSort: sort }); // Update the sort option in the store
  };

  return (
    <View style={styles.container}>
      {/* Use the reusable Header component */}
      <Header title={`#${tag}`} backRoute='/browse' />

      {/* Sort Options */}
      <Sort
        selectedSort={selectedSort}
        sortHandler={sortHandler}
        sortOptions={TAG_SORT_OPTIONS}
      />

      {/* Quotes Section */}
      <Quotes selectedSort={selectedSort} user={user} tag={tag} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

