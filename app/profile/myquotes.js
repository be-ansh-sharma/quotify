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
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';

export default function MyQuotes() {
  const user = useUserStore((state) => state.user);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMoreQuotes, setHasMoreQuotes] = useState(true);
  const [filter, setFilter] = useState('public'); // 'public' or 'private'
  const [pageSize] = useState(10);

  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  const loadQuotes = async (isLoadMore = false) => {
    if (isLoadMore && !hasMoreQuotes) return;

    isLoadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const quoteIds =
        filter === 'private'
          ? user?.privateQuotes || []
          : user?.publicQuotes || [];

      if (quoteIds.length > 0) {
        const startIndex = isLoadMore ? lastDoc || 0 : 0;
        const endIndex = startIndex + pageSize;
        const pageIds = quoteIds.slice(startIndex, endIndex);

        if (pageIds.length > 0) {
          const fetchedQuotes = await fetchQuotesByIds(pageIds);
          const newQuotes = Array.isArray(fetchedQuotes) ? fetchedQuotes : [];

          if (newQuotes.length > 0) {
            newQuotes.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
          }

          setQuotes((prev) =>
            isLoadMore ? [...prev, ...newQuotes] : newQuotes
          );
          setLastDoc(endIndex);
          setHasMoreQuotes(endIndex < quoteIds.length);
        } else {
          setHasMoreQuotes(false);
        }
      }
    } catch (error) {
      console.error('Error fetching user quotes:', error);
      setQuotes(isLoadMore ? quotes : []);
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
              SnackbarService.show('Private quote deleted successfully.');
            } catch (error) {
              console.error('Error deleting private quote:', error);
              SnackbarService.show(
                'Failed to delete the quote. Please try again.'
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
    } else {
      loadQuotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, user?.uid]);

  const renderEmptyState = (message) => (
    <View style={styles.container}>
      <Header title='My Quotes' backRoute='/profile' />
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    </View>
  );

  const renderQuoteList = () => (
    <FlatList
      data={quotes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.tileContainer}>
          <Tile quote={item} user={user} />
          {filter === 'private' && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePrivateQuote(item.id)}
            >
              <MaterialIcons name='delete' size={16} color={COLORS.error} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      contentContainerStyle={styles.listContent}
      onEndReached={() => loadQuotes(true)}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore && <ActivityIndicator size='small' color={COLORS.primary} />
      }
    />
  );

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
            Public
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

      {quotes.length > 0
        ? renderQuoteList()
        : renderEmptyState(
            filter === 'public'
              ? "You haven't posted any public quotes yet."
              : "You haven't saved any private quotes yet."
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

