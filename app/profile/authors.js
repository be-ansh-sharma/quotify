import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Header from 'components/header/Header'; // Import the Header component
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';
import { MaterialIcons } from '@expo/vector-icons'; // Switch to MaterialIcons for consistency

export default function FavoriteAuthors() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isGuest = useUserStore((state) => state.isGuest);

  const renderEmptyState = (message) => (
    <SafeAreaView style={styles.safeArea}>
      {/* Replace the custom header with the Header component */}
      <Header title='Favorite Authors' backRoute='/profile' />

      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    </SafeAreaView>
  );

  const renderAuthor = ({ item }) => {
    const scale = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.95,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    return (
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => router.push(`/authors/${item}`)}
        style={styles.tile}
      >
        <Animated.View
          style={[
            styles.tileContent,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <Text style={styles.tileText}>{item}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (isGuest) {
    return renderEmptyState('Login to follow your favorite authors.');
  }

  if (!user?.followedAuthors?.length) {
    return renderEmptyState("You haven't followed any authors yet.");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Replace the custom header with the Header component */}
      <Header title='Favorite Authors' backRoute='/profile' />

      <FlatList
        data={user.followedAuthors}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={renderAuthor}
        numColumns={2} // Display 2 tiles per row
        columnWrapperStyle={styles.row} // Style for rows
        contentContainerStyle={styles.grid} // Style for the grid
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Remove header styles since we're using the Header component
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.placeholder,
    textAlign: 'center',
    lineHeight: 26,
  },
  grid: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  tile: {
    flex: 1,
    marginHorizontal: 8,
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    elevation: 6,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 16,
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text, // Use COLORS.text instead of COLORS.onSurface for consistency
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});

