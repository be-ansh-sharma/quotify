import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from 'styles/theme';
import { useRouter } from 'expo-router';

const Header = ({
  title,
  leftIcon = 'arrow-back',
  leftAction,
  backRoute,
  rightIcon,
  rightAction,
}) => {
  const router = useRouter();
  const handleLeftAction = () => {
    if (leftAction) {
      leftAction();
    } else if (backRoute) {
      router.push(backRoute);
    } else {
      router.back();
    }
  };

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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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

