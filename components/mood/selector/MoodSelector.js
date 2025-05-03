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
    iconScale.value = withSpring(1.4, { damping: 5 });
    setTimeout(() => {
      iconScale.value = withSpring(1);
    }, 150);
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
            size={22}
            color={isSelected ? COLORS.background : COLORS.primary}
          />
        </Animated.View>
        <Text style={[styles.moodText, isSelected && styles.selectedMoodText]}>
          {mood.label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// Main MoodSelector component that was missing
const MoodSelector = ({ selectedMood, onSelectMood }) => {
  const scrollRef = useRef(null);

  const handleSelectMood = (mood) => {
    onSelectMood(mood);

    // Find the index of the selected mood to scroll to it
    const moodIndex = moods.findIndex((m) => m.key === mood);
    if (scrollRef.current && moodIndex > 1) {
      // Calculate approximate scroll position (can be adjusted based on your item widths)
      const scrollX = moodIndex * 120; // Assuming each item is ~120px wide
      scrollRef.current.scrollTo({ x: scrollX, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling today?</Text>
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
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  moodList: {
    paddingHorizontal: 8,
  },
  moodItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexDirection: 'row',
  },
  selectedMoodItem: {
    backgroundColor: COLORS.primary,
  },
  moodText: {
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  selectedMoodText: {
    color: COLORS.background,
  },
});

// This default export was missing - this is what caused the error
export default MoodSelector;

