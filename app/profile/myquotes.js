import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Header from 'components/header/Header';
import useUserStore from 'stores/userStore';
import { useAppTheme } from 'context/AppThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchQuotesByIds, deletePrivateQuote } from 'utils/firebase/firestore';
import Tile from 'components/quotes/tile/Tile';
import { showMessage } from 'react-native-flash-message';

const PAGE_SIZE = 10;

export default function MyQuotes() {
  const user = useUserStore((state) => state.user);
  const [quotes, setQuotes] = useState([]);
  const [pendingQuotes, setPendingQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('public'); // 'public' or 'private'

  // Pagination state variables
  const [nextIndex, setNextIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [processedChunks, setProcessedChunks] = useState(0);

  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  const loadQuotes = async (isLoadMore = false) => {
    if (isLoadMore && !hasMore) return;

    isLoadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const quoteIds =
        filter === 'private'
          ? user?.privateQuotes || []
          : user?.publicQuotes || [];

      if (quoteIds.length > 0 || filter === 'public') {
        // Get the result object with quotes and pagination info
        const {
          quotes: fetchedQuotes,
          pendingQuotes: fetchedPendingQuotes,
          hasMore: moreAvailable,
          nextIndex: newNextIndex,
          processedChunks: updatedChunks,
        } = await fetchQuotesByIds(
          quoteIds,
          isLoadMore ? nextIndex : 0,
          PAGE_SIZE,
          isLoadMore ? processedChunks : 0,
          filter, // Pass the filter type
          user?.uid // Pass user ID to fetch pending quotes
        );

        // Update quotes
        if (fetchedQuotes && fetchedQuotes.length > 0) {
          setQuotes((prev) =>
            isLoadMore ? [...prev, ...fetchedQuotes] : fetchedQuotes
          );
        } else if (!isLoadMore) {
          setQuotes([]);
        }

        // Update pending quotes (only for public filter and first load)
        if (!isLoadMore && filter === 'public') {
          setPendingQuotes(fetchedPendingQuotes || []);
        }

        // Update pagination state
        setNextIndex(newNextIndex);
        setHasMore(moreAvailable);
        setProcessedChunks(updatedChunks);
      } else {
        setQuotes([]);
        setPendingQuotes([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching user quotes:', error);
    } finally {
      isLoadMore ? setLoadingMore(false) : setLoading(false);
    }
  };

  const handleDeletePrivateQuote = async (quoteId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this private quote? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deletePrivateQuote(quoteId);
              setQuotes((prev) => prev.filter((quote) => quote.id !== quoteId));
              if (user && user.privateQuotes) {
                const updatedPrivateQuotes = user.privateQuotes.filter(
                  (id) => id !== quoteId
                );
                useUserStore.setState({
                  user: {
                    ...user,
                    privateQuotes: updatedPrivateQuotes,
                  },
                });
              }
              showMessage({
                message: 'Private quote deleted successfully.',
                type: 'success',
              });
            } catch (error) {
              console.error('Error deleting private quote:', error);
              showMessage({
                message: 'Failed to delete the quote. Please try again.',
                type: 'danger',
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Reset pagination when filter changes
  useEffect(() => {
    setNextIndex(0);
    setHasMore(true);
    setProcessedChunks(0);
    setQuotes([]);
    setPendingQuotes([]);
    loadQuotes();
  }, [filter, user?.uid]);

  const renderQuoteItem = ({ item }) => (
    <View style={styles.tileContainer}>
      {/* Pass the quote with isPending flag to Tile */}
      <Tile
        quote={item}
        user={user}
        hideActions={item.isPending} // Explicitly hide actions for pending quotes
      />

      {/* Show pending status banner for pending quotes */}
      {item.isPending && (
        <View style={styles.pendingBanner}>
          <MaterialIcons name='schedule' size={16} color={COLORS.text} />
          <Text style={styles.pendingText}>Pending Approval</Text>
        </View>
      )}

      {/* Show delete button for private quotes only */}
      {filter === 'private' && !item.isPending && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePrivateQuote(item.id)}
        >
          <MaterialIcons name='delete' size={16} color={COLORS.error} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = (message) => (
    <View style={styles.container}>
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <ActivityIndicator size='small' color={COLORS.primary} />;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  if (!user?.uid) {
    return renderEmptyState('Login to view your posted quotes.');
  }

  // Combine pending quotes with regular quotes for public filter
  const displayQuotes =
    filter === 'public' ? [...pendingQuotes, ...quotes] : quotes;

  return (
    <View style={styles.container}>
      <Header title='My Quotes' backRoute='/profile' />

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'public' && styles.activeFilter,
          ]}
          onPress={() => setFilter('public')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'public' && styles.activeFilterText,
            ]}
          >
            Public{' '}
            {pendingQuotes.length > 0 && `(${pendingQuotes.length} pending)`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'private' && styles.activeFilter,
          ]}
          onPress={() => setFilter('private')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'private' && styles.activeFilterText,
            ]}
          >
            Private
          </Text>
        </TouchableOpacity>
      </View>

      {displayQuotes.length > 0 ? (
        <FlatList
          data={displayQuotes}
          keyExtractor={(item) =>
            `${item.id}_${item.isPending ? 'pending' : 'approved'}`
          }
          renderItem={renderQuoteItem}
          contentContainerStyle={styles.listContent}
          onEndReached={() => loadQuotes(true)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      ) : loading ? (
        <ActivityIndicator size='large' color={COLORS.primary} />
      ) : (
        renderEmptyState(
          filter === 'public'
            ? "You haven't posted any public quotes yet."
            : "You haven't saved any private quotes yet."
        )
      )}
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: COLORS.surface,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: `${COLORS.disabled}20`,
    },
    filterButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    activeFilter: {
      backgroundColor: COLORS.primary,
    },
    filterText: {
      fontSize: 14,
      color: COLORS.text,
    },
    activeFilterText: {
      color: COLORS.onPrimary,
      fontWeight: '600',
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
      padding: 16,
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
    pendingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      backgroundColor: `${COLORS.warning}20`,
      borderBottomWidth: 1,
      borderBottomColor: `${COLORS.warning}30`,
    },
    pendingText: {
      marginLeft: 6,
      fontSize: 12,
      color: COLORS.text,
      fontWeight: '500',
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: `${COLORS.disabled}20`,
    },
    deleteButtonText: {
      marginLeft: 8,
      fontSize: 14,
      color: COLORS.error,
      fontWeight: '500',
    },
  });

