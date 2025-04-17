import React, { use, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from 'styles/theme';
import { fetchUserQuotesPaginated } from 'utils/firebase/firestore';
import Tile from 'components/quotes/tile/Tile'; // Import the Tile component
import useUserStore from 'stores/userStore';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function UserQuotes() {
  const [userQuotes, setUserQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const user = useUserStore((state) => state.user); // Assuming you have a user store to get the current user

  const PAGE_SIZE = 10; // Number of quotes to fetch per page

  const loadUserQuotes = async (isLoadMore = false) => {
    if (isLoadMore && !hasMore) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const { quotes, lastDoc } = await fetchUserQuotesPaginated(
        PAGE_SIZE,
        lastVisible
      );

      if (isLoadMore) {
        setUserQuotes((prev) => [...prev, ...quotes]);
      } else {
        setUserQuotes(quotes);
      }

      setLastVisible(lastDoc);
      setHasMore(quotes.length === PAGE_SIZE); // If less than PAGE_SIZE, no more data
    } catch (error) {
      console.error('Error loading user quotes:', error);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadUserQuotes();
  }, []);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size='small' color={COLORS.primary} />
      </View>
    );
  };

  if (loading && userQuotes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  if (!loading && userQuotes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.banner}>
          <TouchableOpacity
            onPress={() => router.replace('/browse')}
            style={styles.backButton}
          >
            <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
          </TouchableOpacity>
          <Text style={styles.bannerText}>Tags</Text>
        </View>
        <Text style={styles.emptyText}>
          No user-submitted quotes available.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <TouchableOpacity
          onPress={() => router.replace('/browse')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.bannerText}>Tags</Text>
      </View>
      <FlatList
        data={userQuotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Tile quote={item} user={user} />} // Use the Tile component to render each quote
        contentContainerStyle={styles.listContent}
        onEndReached={() => loadUserQuotes(true)} // Load more quotes when reaching the end
        onEndReachedThreshold={0.5} // Trigger when 50% from the bottom
        ListFooterComponent={renderFooter} // Show loading spinner when loading more
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.placeholder,
  },
  listContent: {
    paddingBottom: 16,
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

