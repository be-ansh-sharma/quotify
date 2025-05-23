import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header';

export default function ProSuccessScreen() {
  const router = useRouter();
  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);
  const animationRef = React.useRef(null);

  useEffect(() => {
    if (animationRef.current) {
      // Start or restart the animation
      animationRef.current.play();
    }
  }, []);

  return (
    <View style={styles.container}>
      <Header title='Welcome to Pro!' backRoute={null} />
      <View style={styles.content}>
        <View style={styles.animationContainer}>
          <LottieView
            ref={animationRef}
            source={require('../../../assets/animations/success.json')}
            autoPlay
            loop={false}
            style={styles.animation}
          />
        </View>

        <Text style={styles.title}>You're Now Pro!</Text>
        <Text style={styles.message}>
          Thanks for your support! Enjoy all premium features of Quotify.
        </Text>

        <View style={styles.featuresContainer}>
          <Text style={styles.featureItem}>✓ All premium backgrounds</Text>
          <Text style={styles.featureItem}>✓ Custom collections</Text>
          <Text style={styles.featureItem}>✓ Ad-free experience</Text>
          <Text style={styles.featureItem}>✓ Priority support</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/profile')}
        >
          <Text style={styles.buttonText}>Continue to App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    animationContainer: {
      width: 200,
      height: 200,
      marginBottom: 20,
    },
    animation: {
      width: '100%',
      height: '100%',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: COLORS.primary,
      textAlign: 'center',
      marginBottom: 16,
    },
    message: {
      fontSize: 18,
      color: COLORS.text,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    featuresContainer: {
      alignSelf: 'stretch',
      marginBottom: 36,
      paddingHorizontal: 40,
    },
    featureItem: {
      fontSize: 17,
      color: COLORS.text,
      marginBottom: 10,
    },
    button: {
      backgroundColor: COLORS.primary,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 8,
      marginTop: 10,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
  });

