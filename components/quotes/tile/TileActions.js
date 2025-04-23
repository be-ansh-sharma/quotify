import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from 'styles/theme';

function TileActions({
  selectedReaction,
  reactions,
  isBookmarked,
  listCount,
  onReactionPress,
  onReactionLongPress,
  onBookmarkPress,
  onSharePress,
  handleSelectReaction,
  toggleReactionTray,
}) {
  const handleReactionPress = () => {
    if (selectedReaction) {
      handleSelectReaction(selectedReaction);
    } else {
      toggleReactionTray();
    }
  };

  // Calculate total reactions - explicitly convert to numbers to prevent string concatenation
  const totalReactions = Object.values(reactions).reduce(
    (sum, count) => sum + Number(count),
    0
  );

  return (
    <View style={styles.actions}>
      <View style={styles.leftActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleReactionPress}
          onLongPress={onReactionLongPress}
        >
          <View style={styles.reactionIconWrapper}>
            <Text style={styles.reactionIcon}>
              {selectedReaction === 'mindblown' && '🤯'}
              {selectedReaction === 'fire' && '🔥'}
              {selectedReaction === 'love' && '❤️'}
              {selectedReaction === 'funny' && '😂'}
              {selectedReaction === 'heartEyes' && '😍'}
              {!selectedReaction && (
                <FontAwesome name='heart-o' size={20} color={COLORS.icon} />
              )}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onBookmarkPress}>
          <View>
            <FontAwesome
              name={isBookmarked ? 'bookmark' : 'bookmark-o'}
              size={20}
              color={isBookmarked ? COLORS.primary : COLORS.icon}
            />
            {listCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{listCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={onSharePress}>
          <FontAwesome name='share-alt' size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.rightActions}>
        {totalReactions > 0 ? (
          <>
            <View style={styles.reactionStack}>
              {Object.entries(reactions)
                .filter(([_, count]) => count > 0)
                .slice(0, 5)
                .map(([type, _], index) => (
                  <View
                    key={type}
                    style={[
                      styles.stackedEmoji,
                      { right: index * 12, zIndex: 10 - index },
                    ]}
                  >
                    <Text style={styles.reactionEmoji}>
                      {type === 'mindblown' && '🤯'}
                      {type === 'fire' && '🔥'}
                      {type === 'love' && '❤️'}
                      {type === 'funny' && '😂'}
                      {type === 'heartEyes' && '😍'}
                    </Text>
                  </View>
                ))}
            </View>
            <Text style={styles.totalReactionCount}>{totalReactions}</Text>
          </>
        ) : (
          // Add a placeholder to maintain height when no reactions
          <View style={styles.emptyReactions} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24, // Ensure consistent minimum height
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  reactionIconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionIcon: {
    fontSize: 20, // Consistent font size for both emoji and icon
    color: COLORS.icon,
    textAlign: 'center',
    lineHeight: 24, // Force consistent line height
  },
  reactionCount: {
    fontSize: 14,
    color: COLORS.text,
    marginRight: 8,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  shareButton: {
    marginRight: 16,
  },
  reactionStack: {
    flexDirection: 'row',
    position: 'relative',
    height: 24,
    width: 60, // Adjust based on your needs
    marginRight: 4,
  },
  stackedEmoji: {
    position: 'absolute',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  totalReactionCount: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  emptyReactions: {
    width: 64, // Match the width of populated reaction stack + count
    height: 24,
  },
});

export default React.memo(TileActions);

