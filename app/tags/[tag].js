import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Sort from 'components/sort/Sort';
import Quotes from 'components/quotes/Quotes';
import useUserStore from 'stores/userStore';
import { TAG_SORT_OPTIONS } from 'config/sortConfig';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native-paper';

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
      <View style={styles.banner}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.bannerText}>#{tag}</Text>
      </View>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
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

