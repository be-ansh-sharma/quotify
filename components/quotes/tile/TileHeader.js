import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from 'context/AppThemeContext'; // Import theme context
import { getInitials } from '../../../utils/helpers';

function TileHeader({ quote, onPress, onLongPress }) {
  const { COLORS } = useAppTheme(); // Get theme colors

  const styles = getStyles(COLORS); // Generate styles dynamically based on theme

  return (
    <TouchableOpacity
      style={styles.header}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(quote.author)}</Text>
      </View>
      <Text style={styles.author}>{quote.author}</Text>
    </TouchableOpacity>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.primary, // Use theme's primary color
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: COLORS.avatarText, // Use theme's onPrimary color for contrast
      fontSize: 14,
      fontWeight: 'bold',
    },
    author: {
      fontSize: 14,
      fontWeight: '500',
      color: COLORS.text, // Use theme's text color
    },
  });

export default React.memo(TileHeader);

