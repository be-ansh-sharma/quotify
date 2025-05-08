import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from 'styles/theme';
import Header from 'components/header/Header'; // Import the reusable Header component

export default function PrivacyPolicy() {
  return (
    <View style={styles.container}>
      {/* Use the reusable Header component */}
      <Header title='Privacy Policy' backRoute='/settings' />

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

