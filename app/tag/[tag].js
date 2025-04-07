import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function AuthorScreen() {
  const { author } = useLocalSearchParams();
  const decodedAuthor = decodeURIComponent(author ?? '');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Author: {decodedAuthor}</Text>
      {/* Add more details about the author here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

