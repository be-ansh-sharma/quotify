import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ProPage() {
  const router = useRouter();
  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  return (
    <View style={styles.container}>
      <Header title='Go Pro' />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Unlock Quotify Pro</Text>
        <Text style={styles.subtitle}>Just $4.99 - One-time payment</Text>
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Icon name='image' size={24} color={COLORS.primary} />
            <Text style={styles.feature}>Dozens of premium backgrounds</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name='bookmark' size={24} color={COLORS.primary} />
            <Text style={styles.feature}>Multiple bookmark collections</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name='library-books' size={24} color={COLORS.primary} />
            <Text style={styles.feature}>Unlimited private quote library</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name='share' size={24} color={COLORS.primary} />
            <Text style={styles.feature}>Advanced sharing options</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name='verified' size={24} color={COLORS.primary} />
            <Text style={styles.feature}>Premium badges on your quotes</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name='block' size={24} color={COLORS.primary} />
            <Text style={styles.feature}>Ad-free experience</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name='palette' size={24} color={COLORS.primary} />
            <Text style={styles.feature}>Custom themes and fonts</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name='auto-awesome' size={24} color={COLORS.primary} />
            <Text style={styles.feature}>Priority access to new features</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name='support-agent' size={24} color={COLORS.primary} />
            <Text style={styles.feature}>Priority customer support</Text>
          </View>
          {/* You could also add this more specific support feature */}
          <View style={styles.featureItem}>
            <Icon name='email' size={24} color={COLORS.primary} />
            <Text style={styles.feature}>Direct email support</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name='star' size={24} color={COLORS.primary} />
            <Text style={styles.feature}>And much more!</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.proButton}
          onPress={() => router.push('/profile/pro/checkout')}
        >
          <Text style={styles.buttonText}>Continue to Payment</Text>
        </TouchableOpacity>
      </ScrollView>
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
      padding: 24,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: COLORS.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 18,
      color: COLORS.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    featureList: {
      marginBottom: 32,
      alignSelf: 'stretch',
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    feature: {
      fontSize: 16,
      color: COLORS.text,
      marginLeft: 8,
    },
    proButton: {
      backgroundColor: COLORS.primary,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.onPrimary,
    },
  });

