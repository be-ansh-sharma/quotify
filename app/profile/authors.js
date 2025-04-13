import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';

export default function FavoriteAuthors() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);

  const renderAuthor = ({ item }) => (
    <TouchableOpacity
      style={styles.authorTile}
      onPress={() => router.push(`/authors/${item.id}`)} // Navigate to the author's quotes
    >
      <Text style={styles.authorName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={user?.followedAuthors || []} // Use authors directly from the user store
        keyExtractor={(item) => item.id}
        renderItem={renderAuthor}
        contentContainerStyle={styles.listContent}
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
  listContent: {
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
