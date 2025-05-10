import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from 'styles/theme';
import { getInitials } from '../../../utils/helpers';

function TileHeader({ quote, onPress, onLongPress }) {
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.avatarText,
    fontSize: 14,
    fontWeight: 'bold',
  },
  author: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.onSurface,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
});

export default React.memo(TileHeader);

