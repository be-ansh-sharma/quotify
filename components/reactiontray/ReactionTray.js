import React from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ReactionTray = ({ onSelectReaction, onClose, animationValue }) => {
  const reactions = [
    { type: 'mindblown', emoji: '🤯' }, // Thought-provoking
    { type: 'fire', emoji: '🔥' }, // Inspiring
    { type: 'love', emoji: '❤️' }, // Heartfelt
    { type: 'uplifting', emoji: '🙌' }, // Uplifting
    { type: 'insight', emoji: '💡' }, // Insightful
    { type: 'heartEyes', emoji: '😍' }, // Beautiful/Adoration
    { type: 'sparkles', emoji: '✨' }, // Magical/Beautiful
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
      </ScrollView>
    </Animated.View>
  );
};

const getStyles = (COLORS) =>
  StyleSheet.create({
    trayContainer: {
      backgroundColor: `${COLORS.surface}F0`,
      paddingVertical: 6, // Further reduced
      paddingHorizontal: 10, // Further reduced
      borderRadius: 20,
      borderWidth: 1,
      borderColor: COLORS.border || COLORS.shadow,
      shadowColor: COLORS.shadow,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
      position: 'absolute',
      bottom: 60,
      alignSelf: 'center',
      zIndex: 10,
      maxWidth: SCREEN_WIDTH * 0.85, // Cap the width for smaller phones
    },
    scrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reactionButton: {
      marginHorizontal: 5, // Further reduced from 8
      padding: 4, // Slightly smaller touch target
    },
    reactionEmoji: {
      fontSize: 20, // Further reduced from 22
    },
  });

export default ReactionTray;

