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

export default function MyQuotes() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [myQuotes, setMyQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMyQuotes = async () => {
    setLoading(true);
    try {
      const quotes = await fetchQuotesByUser(user?.uid); // Fetch quotes by the user's ID
      setMyQuotes(quotes);
    } catch (error) {
      console.error('Error fetching user quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyQuotes();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={COLORS.primary} />
      </View>
    );
  }

  if (!loading && myQuotes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You haven't posted any quotes yet.</Text>
      </View>
    );
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

