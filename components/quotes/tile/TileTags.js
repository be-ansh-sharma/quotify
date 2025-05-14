import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from 'context/AppThemeContext'; // Import theme hook

function TileTags({ tags, onTagPress }) {
  const { COLORS } = useAppTheme(); // Get dynamic theme colors
  const styles = getStyles(COLORS); // Generate styles with current theme colors

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

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 4,
    },
    tag: {
      backgroundColor: COLORS.tag, // Now uses theme color
      borderRadius: 12,
      paddingVertical: 3,
      paddingHorizontal: 8,
      marginRight: 6,
      marginBottom: 4,
    },
    tagText: {
      fontSize: 12,
      color: COLORS.onPrimary,
    },
  });

export default React.memo(TileTags);

