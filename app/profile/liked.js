import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Header from 'components/header/Header';
import useUserStore from 'stores/userStore';
import { useAppTheme } from 'context/AppThemeContext';
import { fetchQuotesByIds } from 'utils/firebase/firestore';
import Tile from 'components/quotes/tile/Tile';
import Skelton from 'components/skelton/Skelton';

const PAGE_SIZE = 10;

export default function LikedQuotes() {
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const [likedQuotes, setLikedQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextIndex, setNextIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [processedChunks, setProcessedChunks] = useState(0);
  const prevReactionsRef = useRef([]);

  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  const getUserReactedQuoteIds = () => {
    if (!user || !user.reactions) return [];
    const reactionTypes = Object.keys(user.reactions || {});
    const allReactedQuoteIds = [];
    reactionTypes.forEach((type) => {
      if (Array.isArray(user.reactions[type])) {
        user.reactions[type].forEach((id) => {
          if (!allReactedQuoteIds.includes(id)) {
            allReactedQuoteIds.push(id);
          }
        });
      }
    });
    return allReactedQuoteIds;
  };

  const loadLikedQuotes = async (isLoadMore = false) => {
    const reactedQuoteIds = getUserReactedQuoteIds();

    if (reactedQuoteIds.length === 0) {
      setLoading(false);
      setHasMore(false);
      return;
    }

    if (isLoadMore && (!hasMore || loadingMore)) return;

    isLoadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const {
        quotes,
        hasMore: moreAvailable,
        nextIndex: newNextIndex,
        processedChunks: updatedChunks,
      } = await fetchQuotesByIds(
        reactedQuoteIds,
        nextIndex,
        PAGE_SIZE,
        processedChunks
      );

      setLikedQuotes((prevQuotes) => {
        const quotesById = {};
        prevQuotes.forEach((quote) => {
          if (quote && quote.id) {
            quotesById[quote.id] = quote;
          }
        });
        quotes?.forEach((quote) => {
          if (quote && quote.id) {
            quotesById[quote.id] = quote;
          }
        });
        return Object.values(quotesById);
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
    const reactedQuoteIds = getUserReactedQuoteIds();
    const prevReactions = Array.isArray(prevReactionsRef.current)
      ? prevReactionsRef.current
      : [];
    let hasReactionsChanged = reactedQuoteIds.length !== prevReactions.length;
    if (!hasReactionsChanged && reactedQuoteIds.length > 0) {
      try {
        hasReactionsChanged = !reactedQuoteIds.every(
          (id, index) => id === prevReactions[index]
        );
      } catch (error) {
        console.error('Error comparing reaction arrays:', error);
        hasReactionsChanged = true;
      }
    }
    if (!hasReactionsChanged) {
      return;
    }
    prevReactionsRef.current = [...reactedQuoteIds];
    if (reactedQuoteIds.length === 0) {
      setLikedQuotes([]);
      return;
    }
    setLikedQuotes((prevQuotes) => {
      const currentQuotes = Array.isArray(prevQuotes) ? prevQuotes : [];
      try {
        const updatedQuotes = currentQuotes.filter(
          (quote) => quote && quote.id && reactedQuoteIds.includes(quote.id)
        );
        const missingQuoteIds = reactedQuoteIds.filter(
          (id) => !updatedQuotes.some((quote) => quote && quote.id === id)
        );
        if (missingQuoteIds.length > 0) {
          fetchQuotesByIds(missingQuoteIds)
            .then(({ quotes: newQuotes }) => {
              if (Array.isArray(newQuotes) && newQuotes.length > 0) {
                setLikedQuotes((currentQuotes) => {
                  const current = Array.isArray(currentQuotes)
                    ? currentQuotes
                    : [];
                  return [...current, ...newQuotes];
                });
              }
            })
            .catch((error) => {
              console.error('Error fetching missing quotes:', error);
            });
        }
        return updatedQuotes;
      } catch (error) {
        console.error('Error updating liked quotes:', error);
        return currentQuotes;
      }
    });
  }, [user?.reactions, user?.likes]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size='small' color={COLORS.primary} />;
  };

  const renderEmptyState = (message) => (
    <SafeAreaView style={styles.safeArea}>
      <Header title='Your Reactions' backRoute='/profile' />
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    </SafeAreaView>
  );

  if (loading && likedQuotes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Skelton />
      </View>
    );
  }

  if (!user?.uid) {
    return renderEmptyState('Login to view your reactions to quotes.');
  }

  if (!likedQuotes.length) {
    return renderEmptyState("You haven't reacted to any quotes yet.");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title='Your Reactions' backRoute='/profile' />
      <FlatList
        data={likedQuotes.filter(
          (quote, index, self) =>
            index === self.findIndex((q) => q.id === quote.id)
        )}
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

const getStyles = (COLORS) =>
  StyleSheet.create({
    safeArea: {
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
      paddingHorizontal: 8,
      paddingBottom: 16,
    },
    tileContainer: {
      marginTop: 16,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: COLORS.surface,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  });

