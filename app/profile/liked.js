import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons';
import { fetchQuotesByIds } from 'utils/firebase/firestore';
import Tile from 'components/quotes/tile/Tile';
import Skelton from 'components/skelton/Skelton';

const PAGE_SIZE = 10;

export default function LikedQuotes() {
  const user = useUserStore((state) => state.user);
  const isGuest = useUserStore((state) => state.isGuest);
  const router = useRouter();
  const [likedQuotes, setLikedQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextIndex, setNextIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [processedChunks, setProcessedChunks] = useState(0);

  const loadLikedQuotes = async (isLoadMore = false) => {
    if (isGuest) {
      setLoading(false);
      return;
    }

    console.log('Loading liked quotes...', user.likes);
    if (!user?.likes?.length) {
      setLoading(false);
      setHasMore(false);
      return;
    }

    console.log('Loading liked quotes...', user.likes);

    if (isLoadMore && (!hasMore || loadingMore)) return;

    isLoadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const {
        quotes,
        hasMore: moreAvailable,
        nextIndex: newNextIndex,
        processedChunks: updatedChunks,
      } = await fetchQuotesByIds(
        user.likes,
        nextIndex,
        PAGE_SIZE,
        processedChunks
      );

      setLikedQuotes((prevQuotes) => {
        const existingIds = new Set(prevQuotes.map((quote) => quote.id));
        const filteredNewQuotes = quotes.filter(
          (quote) => !existingIds.has(quote.id)
        );
        return [...prevQuotes, ...filteredNewQuotes];
      });

      setNextIndex(newNextIndex);
      setHasMore(moreAvailable);
      setProcessedChunks(updatedChunks);
    } catch (error) {
      console.error('Error fetching liked quotes:', error);
    } finally {
      isLoadMore ? setLoadingMore(false) : setLoading(false);
    }
  };

  useEffect(() => {
    loadLikedQuotes();
  }, []);

  useEffect(() => {
    if (!user?.likes?.length) {
      setLikedQuotes([]);
      return;
    }

    setLikedQuotes((prevQuotes) =>
      prevQuotes.filter((quote) => user.likes.includes(quote.id))
    );
  }, [user?.likes]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size='small' color={COLORS.primary} />;
  };

  const renderEmptyState = (message) => (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liked Quotes</Text>
      </View>
      <Text style={styles.emptyText}>{message}</Text>
    </SafeAreaView>
  );

  if (loading && likedQuotes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Skelton />
      </View>
    );
  }

  if (isGuest) {
    return renderEmptyState('Login to view your liked quotes.');
  }

  if (!likedQuotes.length) {
    return renderEmptyState("You haven't liked any quotes yet.");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liked Quotes</Text>
      </View>

      <FlatList
        data={likedQuotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.tileContainer}>
            <Tile quote={item} user={user} />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        onEndReached={() => loadLikedQuotes(true)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'flex-start',
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
  tileContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

