import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons'; // For back button
import { useRouter } from 'expo-router';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()} // Navigate back to the previous screen
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      {/* Privacy Policy Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.text}>
          Welcome to Quotify! Your privacy is important to us. This Privacy
          Policy explains how we collect, use, and protect your information when
          you use our app.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        <Text style={styles.text}>
          We may collect the following types of information:
          {'\n'}- Personal information (e.g., name, email address)
          {'\n'}- Usage data (e.g., app interactions, preferences)
          {'\n'}- Device information (e.g., device type, operating system)
        </Text>

        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.text}>
          We use your information to:
          {'\n'}- Provide and improve our services
          {'\n'}- Personalize your experience
          {'\n'}- Communicate with you about updates and promotions
        </Text>

        <Text style={styles.sectionTitle}>Sharing Your Information</Text>
        <Text style={styles.text}>
          We do not share your personal information with third parties except as
          required by law or to provide our services (e.g., analytics
          providers).
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.text}>
          You have the right to:
          {'\n'}- Access and update your personal information
          {'\n'}- Request the deletion of your data
          {'\n'}- Opt out of certain data collection practices
        </Text>

        <Text style={styles.sectionTitle}>Changes to This Policy</Text>
        <Text style={styles.text}>
          We may update this Privacy Policy from time to time. We encourage you
          to review it periodically for any changes.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.text}>
          If you have any questions about this Privacy Policy, please contact us
          at support@quotify.com.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Use the app's background color
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary, // Use the app's primary color for the header
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text, // Use a contrasting color for the text
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
    lineHeight: 22,
  },
});

