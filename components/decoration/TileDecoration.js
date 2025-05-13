import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { useAppTheme } from 'context/AppThemeContext';

export default function TileDecoration({
  size = 100,
  color = '#0099ff',
  seed = 0,
  iconCount = 6,
  opacity = 0.15,
  style = {},
}) {
  // Get the theme context
  const { COLORS, isDarkTheme } = useAppTheme();

  // Determine the best color for icons based on theme
  const iconColor = useMemo(() => {
    // If explicit color provided, use that
    if (color) return color;

    // Otherwise choose appropriate color based on theme
    return isDarkTheme ? '#FFFFFF' : COLORS.primary;
  }, [color, isDarkTheme, COLORS]);

  // Determine appropriate opacity based on theme
  const effectiveOpacity = useMemo(() => {
    return isDarkTheme ? Math.min(opacity * 1.4, 0.25) : opacity;
  }, [opacity, isDarkTheme]);

  // Generate icons based on seed for consistency
  const decorations = useMemo(() => {
    return generateDecorations(
      size,
      iconColor,
      seed,
      iconCount,
      effectiveOpacity
    );
  }, [size, iconColor, seed, iconCount, effectiveOpacity]);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {decorations}
    </View>
  );
}

const generateDecorations = (size, color, seed, count, opacity) => {
  const random = seedRandom(seed || 1);
  const decorations = [];
  const positions = []; // Track positions to avoid clustering

  // Expanded collection of icon types for more variety
  const iconTypes = [
    {
      type: 'circle',
      render: (key, color, opacity) => (
        <Circle
          key={key}
          cx='6'
          cy='6'
          r='5'
          fill={color}
          fillOpacity={opacity}
        />
      ),
    },
    {
      type: 'star',
      render: (key, color, opacity) => (
        <Path
          key={key}
          d='M6,0 L7.5,4.5 L12,5 L8.5,8 L9.5,12 L6,10 L2.5,12 L3.5,8 L0,5 L4.5,4.5 Z'
          fill={color}
          fillOpacity={opacity}
        />
      ),
    },
    {
      type: 'heart',
      render: (key, color, opacity) => (
        <Path
          key={key}
          d='M6,1 C3.5,-0.5 0,1 0,4 C0,7 6,11 6,11 C6,11 12,7 12,4 C12,1 8.5,-0.5 6,1 Z'
          fill={color}
          fillOpacity={opacity}
        />
      ),
    },
    {
      type: 'sparkle',
      render: (key, color, opacity) => (
        <G key={key}>
          <Circle cx='6' cy='6' r='1.5' fill={color} fillOpacity={opacity} />
          <Circle cx='2' cy='6' r='1' fill={color} fillOpacity={opacity} />
          <Circle cx='10' cy='6' r='1' fill={color} fillOpacity={opacity} />
          <Circle cx='6' cy='2' r='1' fill={color} fillOpacity={opacity} />
          <Circle cx='6' cy='10' r='1' fill={color} fillOpacity={opacity} />
        </G>
      ),
    },
    {
      type: 'quote',
      render: (key, color, opacity) => (
        <Path
          key={key}
          d='M0,6 L4,6 L4,12 L0,12 Z M1,8 L3,8 L3,10 L1,10 Z M6,6 L10,6 L10,12 L6,12 Z M7,8 L9,8 L9,10 L7,10 Z M2,0 L8,0 L5,5 L2,0 Z'
          fill={color}
          fillOpacity={opacity}
        />
      ),
    },
    {
      type: 'book',
      render: (key, color, opacity) => (
        <Path
          key={key}
          d='M2,0 L10,0 L10,12 L2,12 Z M3,1 L9,1 L9,11 L3,11 Z M6,0 L6,12'
          stroke={color}
          strokeOpacity={opacity}
          fill='none'
          strokeWidth='1'
        />
      ),
    },
    {
      type: 'hash',
      render: (key, color, opacity) => (
        <Path
          key={key}
          d='M3,0 L3,12 M9,0 L9,12 M0,4 L12,4 M0,8 L12,8'
          stroke={color}
          strokeOpacity={opacity}
          fill='none'
          strokeWidth='1'
        />
      ),
    },
    {
      type: 'diamond',
      render: (key, color, opacity) => (
        <Path
          key={key}
          d='M6,0 L12,6 L6,12 L0,6 Z'
          fill={color}
          fillOpacity={opacity}
        />
      ),
    },
  ];

  // Create a shuffled copy of icon types
  let shuffledTypes = [...iconTypes];
  for (let i = shuffledTypes.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledTypes[i], shuffledTypes[j]] = [shuffledTypes[j], shuffledTypes[i]];
  }

  // Make sure each tile has at least 1-2 different icon types
  const minDifferentTypes = Math.min(3, count);
  const usedTypes = [];

  // First, place one of each required type
  for (let i = 0; i < minDifferentTypes && i < count; i++) {
    // Use the first few shuffled types
    const iconDef = shuffledTypes[i % shuffledTypes.length];
    usedTypes.push(iconDef.type);

    // Generate position
    let x, y;
    let attempts = 0;
    do {
      x = random() * (size - 20) + 10;
      y = random() * (size - 20) + 10;
      attempts++;
    } while (
      positions.some(
        (pos) => Math.hypot(pos.x - x, pos.y - y) < 25 // Increased spacing
      ) &&
      attempts < 10
    );

    positions.push({ x, y });

    // Add the icon
    decorations.push(
      <Svg
        key={`icon-${i}`}
        width='20'
        height='20'
        viewBox='0 0 12 12'
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: [
            { scale: 0.8 + random() * 0.4 },
            { rotate: `${random() * 360}deg` },
          ],
        }}
      >
        {iconDef.render(`icon-${i}`, color, opacity)}
      </Svg>
    );
  }

  // Then fill in the rest with random selections
  for (let i = minDifferentTypes; i < count; i++) {
    // Choose from remaining types or reuse types if necessary
    let potentialTypes = shuffledTypes.filter(
      (type) => !usedTypes.includes(type.type)
    );
    if (potentialTypes.length === 0) {
      potentialTypes = shuffledTypes; // If all types used, start over
    }

    const iconIndex = Math.floor(random() * potentialTypes.length);
    const iconDef = potentialTypes[iconIndex];
    usedTypes.push(iconDef.type);

    // Generate position
    let x, y;
    let attempts = 0;
    do {
      x = random() * (size - 20) + 10;
      y = random() * (size - 20) + 10;
      attempts++;
    } while (
      positions.some(
        (pos) => Math.hypot(pos.x - x, pos.y - y) < 25 // Increased spacing
      ) &&
      attempts < 10
    );

    positions.push({ x, y });

    // Add the icon
    decorations.push(
      <Svg
        key={`icon-${i}`}
        width='20'
        height='20'
        viewBox='0 0 12 12'
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: [
            { scale: 0.8 + random() * 0.4 },
            { rotate: `${random() * 360}deg` },
          ],
        }}
      >
        {iconDef.render(`icon-${i}`, color, opacity)}
      </Svg>
    );
  }

  return decorations;
};

// Simple pseudo-random number generator with seed
function seedRandom(seed) {
  let state = seed;
  return function () {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 10,
  },
});

