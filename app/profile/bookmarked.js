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
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons';

export default function BookmarkedLists() {
  const user = useUserStore((state) => state.user);
  const isGuest = useUserStore((state) => state.isGuest);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState([]);

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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Lists</Text>
      </View>
      <Text style={styles.emptyText}>{message}</Text>
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
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Lists</Text>
      </View>

      {/* Lists */}
      <FlatList
        data={lists}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listTile}
            onPress={() => handleListPress(item.name, item.quotes)}
          >
            <Text style={styles.listTileText}>
              {item.name} ({item.quotes.length})
            </Text>
            <FontAwesome name='chevron-right' size={16} color={COLORS.icon} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.placeholder,
    textAlign: 'center',
    marginTop: 20,
  },
  listContent: {
    paddingHorizontal: 8,
  },
  listTile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listTileText: {
    fontSize: 16,
    color: COLORS.text,
  },
});
