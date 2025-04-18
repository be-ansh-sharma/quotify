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
import { fetchQuotesByUser } from 'utils/firebase/firestore'; // Function to fetch quotes by the user
import Tile from 'components/quotes/tile/Tile'; // Reuse the Tile component for rendering quotes
import Skelton from 'components/skelton/Skelton';

export default function MyQuotes() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isGuest = useUserStore((state) => state.isGuest);
  const [myQuotes, setMyQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyQuotes = async () => {
    setLoading(true);
    try {
      if (!isGuest) {
        const quotes = await fetchQuotesByUser(user?.uid); // Fetch quotes by the user's ID
        setMyQuotes(quotes);
      }
    } catch (error) {
      console.error('Error fetching user quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyQuotes();
  }, []);

  const renderEmptyState = (message) => (
    <View style={styles.emptyContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Quotes</Text>
      </View>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Skelton />
      </View>
    );
  }

  if (isGuest) {
    return renderEmptyState('Login to view your posted quotes.');
  }

  if (!myQuotes.length) {
    return renderEmptyState("You haven't posted any quotes yet.");
  }

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
        <Text style={styles.headerTitle}>My Quotes</Text>
      </View>

      {/* User's Quotes List */}
      <FlatList
        data={myQuotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.tileContainer}>
            <Tile quote={item} user={user} />
          </View>
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
    width: '100%', // Ensure the header occupies the full width
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Align content to the top
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.placeholder,
    textAlign: 'center',
    marginTop: 20, // Add spacing below the header
  },
  listContent: {
    paddingHorizontal: 8,
  },
  tileContainer: {
    marginTop: 16,
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

