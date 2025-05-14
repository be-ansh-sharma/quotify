import React, { useRef } from 'react';
import {
  ScrollView,
  TouchableWithoutFeedback,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { useAppTheme } from 'context/AppThemeContext'; // Add theme hook import
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
const MoodItem = ({ mood, isSelected, onSelect, COLORS, styles }) => {
  // Add styles prop
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
          { borderColor: COLORS.primary },
          isSelected && [
            styles.selectedMoodItem,
            { backgroundColor: COLORS.primary },
          ],
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
            style={[
              styles.moodText,
              { color: COLORS.primary },
              isSelected && { color: COLORS.background },
            ]}
          >
            {mood.label}
          </Text>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const MoodSelector = ({ selectedMood, onSelectMood, showTitle = true }) => {
  const { COLORS } = useAppTheme(); // Get dynamic theme colors
  const scrollRef = useRef(null);
  const styles = getStyles(COLORS); // Generate dynamic styles

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
            COLORS={COLORS} // Pass COLORS to MoodItem
            styles={styles} // Pass styles to MoodItem
          />
        ))}
      </ScrollView>
    </View>
  );
};

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      marginVertical: 6,
    },
    title: {
      fontSize: 14,
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
      marginHorizontal: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      height: 32,
      minWidth: 36,
    },
    selectedMoodItem: {
      minWidth: 100,
    },
    moodText: {
      marginLeft: 4,
      fontWeight: '500',
      fontSize: 12,
      maxWidth: 80,
    },
  });

export default MoodSelector;

