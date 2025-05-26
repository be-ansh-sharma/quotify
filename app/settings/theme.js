import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Divider, Surface, RadioButton } from 'react-native-paper';
import Header from 'components/header/Header';
import useUserStore from 'stores/userStore';
import { useAppTheme } from 'context/AppThemeContext';

export default function ThemeSettings() {
  const theme = useUserStore((state) => state.theme);
  const setTheme = useUserStore((state) => state.setTheme);
  // Add a forceUpdate state
  const [, forceUpdate] = useState(0);

  const { COLORS } = useAppTheme();

  // Create styles dynamically so they update when COLORS changes
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  // Force update after theme change
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    // Add slight delay to ensure theme is applied first
    setTimeout(() => forceUpdate((prev) => prev + 1), 10);
  };

  // Also force update when COLORS change
  useEffect(() => {
    forceUpdate((prev) => prev + 1);
  }, [COLORS]);

  return (
    <View style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <Header title='Theme Settings' backRoute='/settings' />

      <View style={styles.container}>
        <Surface style={styles.card} elevation={2}>
          <RadioButton.Group onValueChange={handleThemeChange} value={theme}>
            <List.Item
              title='System Default'
              description="Follow your device's theme setting"
              left={(props) => (
                <View style={styles.radioContainer}>
                  <List.Icon
                    {...props}
                    icon='theme-light-dark'
                    color={COLORS.primary}
                  />
                  <RadioButton value='system' color={COLORS.primary} />
                </View>
              )}
              onPress={() => handleThemeChange('system')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />
            <Divider style={styles.divider} />

            <List.Item
              title='Light'
              description='Always use light theme'
              left={(props) => (
                <View style={styles.radioContainer}>
                  <List.Icon
                    {...props}
                    icon='white-balance-sunny'
                    color={COLORS.primary}
                  />
                  <RadioButton value='light' color={COLORS.primary} />
                </View>
              )}
              onPress={() => handleThemeChange('light')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />
            <Divider style={styles.divider} />

            <List.Item
              title='Dark'
              description='Always use dark theme'
              left={(props) => (
                <View style={styles.radioContainer}>
                  <List.Icon
                    {...props}
                    icon='moon-waning-crescent'
                    color={COLORS.primary}
                  />
                  <RadioButton value='dark' color={COLORS.primary} />
                </View>
              )}
              onPress={() => handleThemeChange('dark')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
            />
          </RadioButton.Group>
        </Surface>
      </View>
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    container: {
      flex: 1,
      padding: 16,
    },
    card: {
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: COLORS.surface,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    divider: {
      backgroundColor: `${COLORS.disabled}40`,
    },
    listItemTitle: {
      color: COLORS.text,
      fontSize: 16,
    },
    listItemDescription: {
      color: COLORS.secondaryText,
      fontSize: 14,
    },
    radioContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

