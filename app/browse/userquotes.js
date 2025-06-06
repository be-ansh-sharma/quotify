import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from 'context/AppThemeContext'; // Import theme hook
import { fetchUserQuotesPaginated } from 'utils/firebase/firestore';
import Tile from 'components/quotes/tile/Tile'; // Import the Tile component
import useUserStore from 'stores/userStore';
import Header from 'components/header/Header'; // Import the reusable Header component

export default function UserQuotes() {
  const [userQuotes, setUserQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const user = useUserStore((state) => state.user); // Assuming you have a user store to get the current user

  const { COLORS } = useAppTheme(); // Get theme colors dynamically
  const styles = getStyles(COLORS); // Generate styles dynamically

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
      <>
        <Header title='User Quotes' backRoute='/browse' />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No user-submitted quotes available.
          </Text>
        </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {/* Use the reusable Header component */}
      <Header title='User Quotes' backRoute='/browse' />

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
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.background,
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

