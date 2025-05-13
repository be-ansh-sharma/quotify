import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
// Change this import
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header'; // Import the reusable Header component

export default function TermsOfService() {
  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

  return (
    <View style={styles.container}>
      {/* Use the reusable Header component */}
      <Header title='Terms of Service' backRoute='/settings' />

      {/* Terms of Service Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.text}>
          Welcome to Quotify! By using our app, you agree to comply with and be
          bound by the following terms and conditions of use. Please review
          these terms carefully.
        </Text>

        <Text style={styles.sectionTitle}>Use of the App</Text>
        <Text style={styles.text}>
          You agree to use the app only for lawful purposes and in a way that
          does not infringe the rights of others or restrict their use and
          enjoyment of the app.
        </Text>

        <Text style={styles.sectionTitle}>User Accounts</Text>
        <Text style={styles.text}>
          You are responsible for maintaining the confidentiality of your
          account and password and for restricting access to your device. You
          agree to accept responsibility for all activities that occur under
          your account.
        </Text>

        <Text style={styles.sectionTitle}>Intellectual Property</Text>
        <Text style={styles.text}>
          All content included in the app, such as text, graphics, logos, and
          images, is the property of Quotify or its content suppliers and is
          protected by copyright laws.
        </Text>

        <Text style={styles.sectionTitle}>Termination</Text>
        <Text style={styles.text}>
          We reserve the right to terminate or suspend your access to the app at
          any time, without notice, for conduct that we believe violates these
          terms or is harmful to other users of the app.
        </Text>

        <Text style={styles.sectionTitle}>Limitation of Liability</Text>
        <Text style={styles.text}>
          Quotify shall not be liable for any damages arising out of or in
          connection with your use of the app. This includes, but is not limited
          to, direct, indirect, incidental, punitive, and consequential damages.
        </Text>

        <Text style={styles.sectionTitle}>Changes to Terms</Text>
        <Text style={styles.text}>
          We may update these Terms of Service from time to time. We encourage
          you to review them periodically for any changes.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.text}>
          If you have any questions about these Terms of Service, please contact
          us at support@quotify.com.
        </Text>
      </ScrollView>
    </View>
  );
}

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
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

