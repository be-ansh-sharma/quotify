import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from 'styles/theme';

function TileContent({ quote }) {
  return <Text style={styles.text}>{quote.text}</Text>;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8, // Reduced spacing
  },
  text: {
    fontSize: 15, // Slightly reduced if it was larger
    color: COLORS.onSurface,
    lineHeight: 22, // Optimized line height
  },
  // Other styles...
});

export default React.memo(TileContent);

