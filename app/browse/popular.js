import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Quotes from 'components/quotes/Quotes'; // Reuse the Quotes component
import Header from 'components/header/Header'; // Import the reusable Header component
import useUserStore from 'stores/userStore';
// Change this import
import { useAppTheme } from 'context/AppThemeContext';

export default function PopularQuotes() {
  const router = useRouter();
  const [selectedSort] = useState('mostPopular'); // Sort by most popular quotes
  const user = useUserStore((state) => state.user); // Get the user from the store

  const { COLORS } = useAppTheme(); // Get theme colors dynamically

  const styles = getStyles(COLORS); // Generate styles dynamically

  return (
    <View style={styles.container}>
      {/* Use the reusable Header component */}
      <Header title='Popular Quotes' backRoute='/browse' />

      {/* Quotes Component */}
      <Quotes selectedSort={selectedSort} user={user} />
    </View>
  );
}

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background, // Use the app's background color
    },
  });

