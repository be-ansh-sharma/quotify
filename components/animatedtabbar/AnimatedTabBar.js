import React from 'react';
import {
  Animated,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, LIGHT_COLORS } from 'styles/theme';
import { useTabBar } from 'context/TabBarContext';

// Add isDark prop to component signature
export default function AnimatedTabBar({
  state,
  descriptors,
  navigation,
  isDark = true,
}) {
  const { tabBarTranslateY } = useTabBar();

  // Choose appropriate colors based on theme
  const colors = isDark ? COLORS : LIGHT_COLORS;

  return (
    <Animated.View
      style={[
        styles.tabBar,
        {
          // Replace static COLORS with dynamic colors
          backgroundColor: colors.background,
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          transform: [{ translateY: tabBarTranslateY }],
          opacity: tabBarTranslateY.interpolate({
            inputRange: [0, 30, 60],
            outputRange: [1, 0.7, 0],
            extrapolate: 'clamp',
          }),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        let iconName;
        if (route.name === 'home') iconName = 'home';
        else if (route.name === 'browse') iconName = 'search';
        else if (route.name === 'profile') iconName = 'person';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            activeOpacity={1}
            onPress={onPress}
            style={styles.tabItem}
          >
            <MaterialIcons
              name={iconName}
              size={24}
              // Use dynamic colors
              color={isFocused ? colors.primary : colors.placeholder}
            />
            <Text
              style={[
                styles.tabText,
                // Use dynamic colors
                { color: isFocused ? colors.primary : colors.placeholder },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

// Keep static layout styles, move color-specific styles to the component
const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    borderTopWidth: 0.5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabText: {
    fontSize: 12,
    marginTop: 2,
  },
});

