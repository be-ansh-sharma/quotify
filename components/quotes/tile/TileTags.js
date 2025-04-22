import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from 'styles/theme';

function TileTags({ tags, onTagPress }) {
  return (
    <View style={styles.tags}>
      {tags.map((tag, index) => (
        <TouchableOpacity key={index} onPress={() => onTagPress(tag)}>
          <Text style={styles.tag}>#{tag}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    fontSize: 12,
    color: COLORS.tag,
    marginRight: 8,
  },
});

export default React.memo(TileTags);

