import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// Import the hook instead of COLORS
import { useAppTheme } from 'context/AppThemeContext';
import { useRouter, useFocusEffect } from 'expo-router';

const Header = ({
  title,
  leftIcon = 'arrow-back',
  leftAction,
  backRoute,
  rightIcon,
  rightAction,
}) => {
  const router = useRouter();
  // Get COLORS from the theme context
  const { COLORS } = useAppTheme();

  // Create styles with current COLORS
  const styles = getStyles(COLORS);

  const handleLeftAction = () => {
    if (leftAction) {
      leftAction();
    } else if (backRoute) {
      router.push(backRoute);
    } else {
      router.back();
    }
  };

  // Handle system back button/gesture
  useFocusEffect(
    React.useCallback(() => {
      // Only add the handler if we have a custom backRoute
      if (backRoute) {
        const onBackPress = () => {
          router.push(backRoute);
          return true; // Prevent default back behavior
        };

        // Add back handler for Android
        if (Platform.OS === 'android') {
          BackHandler.addEventListener('hardwareBackPress', onBackPress);
        }

        // Clean up when the component is unmounted or blurred
        return () => {
          if (Platform.OS === 'android') {
            BackHandler.removeEventListener('hardwareBackPress', onBackPress);
          }
        };
      }
      return undefined;
    }, [backRoute, router])
  );

  // For iOS gesture handling through navigation props
  useEffect(() => {
    if (Platform.OS === 'ios' && backRoute) {
      // This is limited without direct access to the navigation object
      // A full solution would require customizing the navigator in _layout.js
      // But this serves as a placeholder for where that code would go
    }
  }, [backRoute]);

  return (
    <View style={styles.header}>
      {leftIcon && (
        <TouchableOpacity onPress={handleLeftAction} style={styles.iconButton}>
          <MaterialIcons name={leftIcon} size={24} color={COLORS.primary} />
        </TouchableOpacity>
      )}

      <Text style={styles.headerTitle}>{title}</Text>

      {rightIcon && (
        <TouchableOpacity
          onPress={rightAction}
          style={[styles.iconButton, styles.rightButton]}
        >
          <MaterialIcons name={rightIcon} size={24} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Create styles function that uses COLORS directly
const getStyles = (COLORS) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: COLORS.surface,
      elevation: 3,
    },
    iconButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
    },
    rightButton: {
      marginLeft: 'auto',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.text,
      flex: 1,
      marginLeft: 12,
    },
  });

export default Header;

