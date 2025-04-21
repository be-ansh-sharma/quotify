import React from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const ReactionTray = ({ onSelectReaction, onClose, animationValue }) => {
  const reactions = [
    { type: 'mindblown', emoji: '🤯' },
    { type: 'fire', emoji: '🔥' },
    { type: 'love', emoji: '❤️' },
    { type: 'funny', emoji: '😂' },
    { type: 'heartEyes', emoji: '😍' },
  ];

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

const styles = StyleSheet.create({
  trayContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    zIndex: 10,
  },
  reactionButton: {
    marginHorizontal: 8,
  },
  reactionEmoji: {
    fontSize: 28,
  },
});

export default ReactionTray;

