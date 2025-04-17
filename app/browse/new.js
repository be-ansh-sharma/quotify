import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons'; // For back button
import Quotes from 'components/quotes/Quotes'; // Reuse the Quotes component
import useUserStore from 'stores/userStore';

export default function NewQuotes() {
  const router = useRouter();
  const [selectedSort] = useState('newest'); // Sort by newest quotes
  const user = useUserStore((state) => state.user); // Get the user from the store

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push('/browse')}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Quotes</Text>
      </View>

      {/* Quotes Component */}
      <Quotes selectedSort={selectedSort} user={user} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Use the app's background color
  },
  header: {
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
    color: COLORS.text, // Use a contrasting color for the text
  },
});

