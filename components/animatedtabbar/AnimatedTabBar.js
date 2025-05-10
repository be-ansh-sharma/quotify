import React from 'react';
import {
  Animated,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from 'styles/theme';
import { useTabBar } from 'context/TabBarContext';

export default function AnimatedTabBar({ state, descriptors, navigation }) {
  const { tabBarTranslateY } = useTabBar();

  return (
    <Animated.View
      style={[styles.tabBar, { transform: [{ translateY: tabBarTranslateY }] }]}
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
              color={isFocused ? COLORS.primary : COLORS.placeholder}
            />
            <Text
              style={[
                styles.tabText,
                { color: isFocused ? COLORS.primary : COLORS.placeholder },
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
