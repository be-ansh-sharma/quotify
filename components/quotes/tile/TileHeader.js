import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';
import { getInitials } from 'utils/helpers';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function TileHeader({ quote, onPress, onLongPress }) {
  const { COLORS } = useAppTheme();
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipOpacity] = useState(new Animated.Value(0));

  const styles = getStyles(COLORS);

  const toggleTooltip = () => {
    if (!showTooltip) {
      setShowTooltip(true);
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Hide tooltip after 2 seconds
      setTimeout(() => {
        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setShowTooltip(false));
      }, 2000);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.header}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={1}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(quote.author)}</Text>
        </View>

        <View style={styles.authorContainer}>
          <Text style={styles.author}>{quote.author}</Text>

          {quote.userQuote && (
            <TouchableOpacity onPress={toggleTooltip}>
              <MaterialCommunityIcons
                name='account-circle'
                size={18}
                color={COLORS.primary}
                style={styles.userQuoteIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {showTooltip && (
        <Animated.View style={[styles.tooltip, { opacity: tooltipOpacity }]}>
          <Text style={styles.tooltipText}>User-created quote</Text>
        </Animated.View>
      )}
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      color: COLORS.avatarText,
      fontSize: 14,
      fontWeight: 'bold',
    },
    authorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    author: {
      fontSize: 14,
      fontWeight: '500',
      color: COLORS.text,
    },
    userQuoteIcon: {
      marginLeft: 6,
    },
    tooltip: {
      position: 'absolute',
      backgroundColor: COLORS.surfaceVariant || '#333',
      padding: 8,
      borderRadius: 4,
      left: 60, // Position relative to the author's name
      top: 30, // Position below the header
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      zIndex: 1000,
    },
    tooltipText: {
      color: COLORS.onSurfaceVariant || '#fff',
      fontSize: 12,
    },
  });

export default React.memo(TileHeader);

