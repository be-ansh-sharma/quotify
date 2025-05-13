import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
// Change this import
import { useAppTheme } from 'context/AppThemeContext';

export default function LoadingScreen({ message = 'Loading your quotes...' }) {
  const { COLORS } = useAppTheme(); // Get theme colors dynamically

  const styles = getStyles(COLORS); // Generate styles with current theme

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

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.background,
    },
    content: {
      alignItems: 'center', // Center all content horizontally
    },
    logo: {
      width: 120,
      height: 120,
      marginBottom: 20, // Space between the logo and the title
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLORS.primary,
      marginBottom: 24, // Space between the title and the ActivityIndicator
    },
    message: {
      marginTop: 16, // Space between the ActivityIndicator and the message
      color: COLORS.text,
      fontSize: 16,
      textAlign: 'center',
    },
  });

