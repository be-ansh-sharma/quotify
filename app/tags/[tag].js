import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Sort from 'components/sort/Sort';
import Quotes from 'components/quotes/Quotes';
import useUserStore from 'stores/userStore';
import { TAG_SORT_OPTIONS } from 'config/sortConfig';
// Change this import
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header'; // Import the reusable Header component
import { useLocalSearchParams } from 'expo-router';

export default function TagScreen() {
  const { tag } = useLocalSearchParams();
  const storedSort = useUserStore((state) => state.selectedSort);
  const user = useUserStore((state) => state.user); // Get user data from userStore
  const [selectedSort, setSelectedSort] = useState(storedSort);

  const { COLORS } = useAppTheme(); // Get theme colors dynamically

  const styles = getStyles(COLORS); // Generate styles dynamically

  return (
    <View style={styles.container}>
      {/* Use the reusable Header component */}
      <Header title={`#${tag}`} backRoute='/tags' />

      <Quotes user={user} tag={tag} selectedSort='newest' />
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

