import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from 'styles/theme';

function TileTags({ tags, onTagPress }) {
  return (
    <View style={styles.container}>
      {tags.map((tag, index) => (
        <TouchableOpacity key={index} onPress={() => onTagPress(tag)}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4, // Reduced spacing
  },
  tag: {
    backgroundColor: COLORS.tag,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12, // Make tag text smaller
    color: COLORS.text,
  },
});

export default React.memo(TileTags);

