import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from 'components/header/Header';
import useUserStore from 'stores/userStore';
// Change this import
import { useAppTheme } from 'context/AppThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

export default function BookmarkedLists() {
  const user = useUserStore((state) => state.user);
  const isGuest = useUserStore((state) => state.isGuest);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState([]);

  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

  useEffect(() => {
    if (user?.bookmarklist) {
      // Convert the bookmarklist object into an array of lists
      const userLists = Object.entries(user.bookmarklist).map(
        ([name, quotes]) => ({
          name,
          quotes,
        })
      );
      setLists(userLists);
    }
    setLoading(false);
  }, [user?.bookmarklist]);

  const renderEmptyState = (message) => (
    <View style={styles.container}>
      <Header title='Your Lists' backRoute='/profile' />
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  if (isGuest) {
    return renderEmptyState('Login to create your custom lists');
  }

  if (!lists.length) {
    return renderEmptyState("You haven't created any lists yet.");
  }

  const handleListPress = (listName, quotes) => {
    // Navigate to the ListQuotes component and pass the list details
    router.push({
      pathname: '/profile/listquotes',
      params: { listName, quotes: JSON.stringify(quotes) },
    });
  };

  return (
    <View style={styles.container}>
      {/* Using our reusable Header component */}
      <Header title='Your Lists' backRoute='/profile' />

      {/* Lists */}
      <FlatList
        data={lists}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listTile}
            onPress={() => handleListPress(item.name, item.quotes)}
          >
            <View style={styles.listTileContent}>
              <MaterialIcons name='list' size={20} color={COLORS.primary} />
              <Text style={styles.listTileText}>
                {item.name} ({item.quotes.length})
              </Text>
            </View>
            <MaterialIcons
              name='chevron-right'
              size={24}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 18,
      color: COLORS.placeholder,
      textAlign: 'center',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 24,
    },
    listTile: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: COLORS.surface,
      borderRadius: 8,
      marginBottom: 12,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    listTileContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    listTileText: {
      fontSize: 16,
      color: COLORS.text,
      marginLeft: 12,
      fontWeight: '500',
    },
  });

