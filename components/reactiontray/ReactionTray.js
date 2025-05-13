import React from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';

const ReactionTray = ({ onSelectReaction, onClose, animationValue }) => {
  const reactions = [
    { type: 'mindblown', emoji: '🤯' },
    { type: 'fire', emoji: '🔥' },
    { type: 'love', emoji: '❤️' },
    { type: 'funny', emoji: '😂' },
    { type: 'heartEyes', emoji: '😍' },
  ];

  const { COLORS } = useAppTheme();

  const styles = getStyles(COLORS);

  return (
    <Animated.View
      style={[
        styles.trayContainer,
        {
          opacity: animationValue,
          transform: [
            {
              scale: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
            {
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      {reactions.map((reaction) => (
        <TouchableOpacity
          key={reaction.type}
          style={styles.reactionButton}
          onPress={() => {
            onSelectReaction(reaction.type);
            onClose();
          }}
        >
          <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

const getStyles = (COLORS) =>
  StyleSheet.create({
    trayContainer: {
      flexDirection: 'row',
      backgroundColor: `${COLORS.surface}F0`, // Increased opacity for better visibility
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 24,
      borderWidth: 1, // Add a border for better contrast
      borderColor: COLORS.border || COLORS.shadow, // Use a border color that contrasts with the background
      shadowColor: COLORS.shadow,
      shadowOpacity: 0.3, // Increased shadow opacity for better depth
      shadowRadius: 10, // Increased shadow radius for a more prominent shadow
      shadowOffset: { width: 0, height: 6 },
      elevation: 6, // Android shadow
      position: 'absolute',
      bottom: 60,
      alignSelf: 'center',
      zIndex: 10,
    },
    reactionButton: {
      marginHorizontal: 12,
    },
    reactionEmoji: {
      fontSize: 28,
    },
  });

export default ReactionTray;

