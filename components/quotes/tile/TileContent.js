import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from 'styles/theme';

function TileContent({ quote }) {
  return <Text style={styles.text}>{quote.text}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
});

export default React.memo(TileContent);
