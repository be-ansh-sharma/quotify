import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../../../styles/theme'; // Import COLORS

export default function Tile({ quote }) {
  const getInitials = (name) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    const initials = nameParts.map((part) => part[0]).join('');
    return initials.toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(quote.author)}</Text>
        </View>
        <Text style={styles.author}>{quote.author}</Text>
      </View>

      <Text style={styles.text}>{quote.text}</Text>

      <View style={styles.tags}>
        {quote.tags.map((tag, index) => (
          <Text key={index} style={styles.tag}>
            #{tag}
          </Text>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name='favorite-border' size={20} color={COLORS.icon} />
          {quote.likes > 100 && (
            <Text style={styles.actionText}>{quote.likes}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name='share' size={20} color={COLORS.icon} />
          {quote.shares > 100 && (
            <Text style={styles.actionText}>{quote.shares}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  author: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  text: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.text,
  },
});

