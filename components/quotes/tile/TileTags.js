import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from 'context/AppThemeContext'; // Import theme hook

function TileTags({ tags, onTagPress }) {
  const { COLORS } = useAppTheme(); // Get dynamic theme colors
  const styles = getStyles(COLORS); // Generate styles with current theme colors

  // Show at most 4 tags
  const visibleTags = tags.slice(0, 4);

  return (
    <View style={styles.container}>
      {visibleTags.map((tag, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onTagPress(tag)}
          activeOpacity={1}
        >
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
      backgroundColor: COLORS.tag,
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

