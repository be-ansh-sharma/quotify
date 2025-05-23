import React from 'react';
import { Text, StyleSheet } from 'react-native';
// Change this import
import { useAppTheme } from 'context/AppThemeContext';

function TileContent({ quote }) {
  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

  return <Text style={styles.text}>{quote.text}</Text>;
}

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      marginBottom: 8, // Reduced spacing
    },
    text: {
      fontSize: 15, // Slightly reduced if it was larger
      color: COLORS.onSurface,
      lineHeight: 22, // Optimized line height
    },
  });

export default React.memo(TileContent);

