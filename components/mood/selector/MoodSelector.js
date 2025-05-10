import React, { useRef } from 'react';
import {
  ScrollView,
  TouchableWithoutFeedback,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { COLORS } from 'styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// Keep the same moods array
const moods = [
  { key: 'all', label: 'All Moods', icon: 'mood' },
  { key: 'motivational', label: 'Motivated', icon: 'emoji-events' },
  { key: 'inspirational', label: 'Inspired', icon: 'lightbulb' },
  { key: 'wise', label: 'Thoughtful', icon: 'psychology' },
  { key: 'peaceful', label: 'Peaceful', icon: 'spa' },
  { key: 'happy', label: 'Happy', icon: 'sentiment-very-satisfied' },
  { key: 'loving', label: 'Loving', icon: 'favorite' },
  { key: 'ambitious', label: 'Ambitious', icon: 'trending-up' },
  { key: 'resilient', label: 'Resilient', icon: 'fitness-center' },
  { key: 'grateful', label: 'Grateful', icon: 'volunteer-activism' },
  { key: 'reflective', label: 'Reflective', icon: 'auto-stories' },
];

// Simplified compact MoodItem
const MoodItem = ({ mood, isSelected, onSelect }) => {
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handlePress = () => {
    iconScale.value = withSpring(1.3, { damping: 5 }); // Slightly reduced animation
    setTimeout(() => {
      iconScale.value = withSpring(1);
    }, 120); // Slightly faster animation
    onSelect(mood.key);
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={() => (scale.value = withSpring(0.95))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.moodItem,
          isSelected && styles.selectedMoodItem,
          containerStyle,
        ]}
      >
        <Animated.View style={iconStyle}>
          <MaterialIcons
            name={mood.icon}
            size={20} // Reduced size
            color={isSelected ? COLORS.background : COLORS.primary}
          />
        </Animated.View>
        {/* Only show text for selected mood or All Moods */}
        {(isSelected || mood.key === 'all') && (
          <Text
            style={[styles.moodText, isSelected && styles.selectedMoodText]}
          >
            {mood.label}
          </Text>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const MoodSelector = ({ selectedMood, onSelectMood, showTitle = true }) => {
  const scrollRef = useRef(null);

  const handleSelectMood = (mood) => {
    onSelectMood(mood);

    // Find the index of the selected mood to scroll to it
    const moodIndex = moods.findIndex((m) => m.key === mood);
    if (scrollRef.current && moodIndex > 1) {
      // Reduced scroll distance to account for smaller items
      const scrollX = moodIndex * 70;
      scrollRef.current.scrollTo({ x: scrollX, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      {showTitle && (
        <Text style={styles.title}>How are you feeling today?</Text>
      )}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodList}
      >
        {moods.map((mood) => (
          <MoodItem
            key={mood.key}
            mood={mood}
            isSelected={selectedMood === mood.key}
            onSelect={handleSelectMood}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6, // Reduced from 8
  },
  title: {
    fontSize: 14, // Reduced from 16
    fontWeight: '600',
    marginLeft: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  moodList: {
    paddingHorizontal: 8,
  },
  moodItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4, // Reduced from 6
    paddingVertical: 6, // Reduced from 8
    paddingHorizontal: 10, // Reduced from 12
    borderRadius: 16, // Reduced from 20
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    height: 32, // Fixed height for consistency
    minWidth: 36, // Minimum width for icon-only state
  },
  selectedMoodItem: {
    backgroundColor: COLORS.primary,
    minWidth: 100, // Wider to accommodate text
  },
  moodText: {
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 12, // Reduced from 14
    maxWidth: 80, // Limit text width
  },
  selectedMoodText: {
    color: COLORS.background,
  },
});

export default MoodSelector;

