import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons';

export default function FavoriteAuthors() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isGuest = useUserStore((state) => state.isGuest);

  const renderEmptyState = (message) => (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorite Authors</Text>
      </View>
      <Text style={styles.emptyText}>{message}</Text>
    </SafeAreaView>
  );

  const renderAuthor = ({ item }) => (
    <TouchableOpacity
      style={styles.authorTile}
      onPress={() => router.push(`/authors/${item.id}`)}
    >
      <Text style={styles.authorName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (isGuest) {
    return renderEmptyState('Login to follow your favorite authors.');
  }

  if (!user?.followedAuthors?.length) {
    return renderEmptyState("You haven't followed any authors yet.");
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
        <Text style={styles.headerTitle}>Favorite Authors</Text>
      </View>

      <FlatList
        data={user.followedAuthors}
        keyExtractor={(item) => item.id}
        renderItem={renderAuthor}
        contentContainerStyle={styles.listContent}
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
  emptyText: {
    fontSize: 18,
    color: COLORS.placeholder,
    textAlign: 'center',
    marginTop: 20,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  authorTile: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});

