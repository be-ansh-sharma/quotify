import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';

export default function LoadingScreen({ message = 'Loading your quotes...' }) {
  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App logo */}
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode='contain'
        />

        <Text style={styles.title}>Quotify</Text>

        <ActivityIndicator size='large' color={COLORS.primary} />

        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      position: 'absolute', // Position absolutely
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: COLORS.background,
      zIndex: 1000, // Ensure it's above other content
    },
    content: {
      flex: 1,
      justifyContent: 'center', // Center content vertically
      alignItems: 'center', // Center content horizontally
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLORS.primary,
      marginBottom: 24,
    },
    message: {
      marginTop: 16,
      color: COLORS.text,
      fontSize: 16,
      textAlign: 'center',
    },
  });

