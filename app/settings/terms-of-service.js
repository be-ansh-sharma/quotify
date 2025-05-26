import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header';

export default function TermsOfService() {
  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  return (
    <View style={styles.container}>
      <Header title='Terms of Service' backRoute='/settings' />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.text}>
          Welcome to Quotify! By using our app, you agree to comply with and be
          bound by the following terms and conditions. Please review these terms
          carefully before using the app.
        </Text>

        <Text style={styles.sectionTitle}>Use of the App</Text>
        <Text style={styles.text}>
          You agree to use Quotify only for lawful purposes and in a way that
          does not infringe the rights of others or restrict their use and
          enjoyment of the app. You must not use the app to post or share any
          content that is offensive, inappropriate, or violates any laws.
        </Text>

        <Text style={styles.sectionTitle}>User Accounts</Text>
        <Text style={styles.text}>
          You are responsible for maintaining the confidentiality of your
          account and password and for restricting access to your device. You
          agree to accept responsibility for all activities that occur under
          your account. You must provide accurate and complete information when
          creating an account.
        </Text>

        <Text style={styles.sectionTitle}>
          Content and Intellectual Property
        </Text>
        <Text style={styles.text}>
          All content included in the app, such as text, graphics, logos, and
          images, is the property of Quotify or its content suppliers and is
          protected by copyright and intellectual property laws. You may not
          copy, reproduce, or distribute any content from the app without
          permission.
        </Text>

        <Text style={styles.sectionTitle}>User-Generated Content</Text>
        <Text style={styles.text}>
          By submitting quotes or other content to Quotify, you grant us a
          non-exclusive, royalty-free, worldwide license to use, display, and
          distribute your content within the app. You are solely responsible for
          the content you submit and must ensure it does not violate any
          third-party rights or laws.
        </Text>

        <Text style={styles.sectionTitle}>Termination</Text>
        <Text style={styles.text}>
          We reserve the right to terminate or suspend your access to Quotify at
          any time, without notice, for conduct that we believe violates these
          terms or is harmful to other users or the app.
        </Text>

        <Text style={styles.sectionTitle}>Limitation of Liability</Text>
        <Text style={styles.text}>
          Quotify shall not be liable for any damages arising out of or in
          connection with your use of the app. This includes, but is not limited
          to, direct, indirect, incidental, punitive, and consequential damages.
        </Text>

        <Text style={styles.sectionTitle}>Privacy</Text>
        <Text style={styles.text}>
          Your privacy is important to us. Please review our Privacy Policy to
          understand how we collect, use, and protect your information.
        </Text>

        <Text style={styles.sectionTitle}>Changes to Terms</Text>
        <Text style={styles.text}>
          We may update these Terms of Service from time to time. We encourage
          you to review them periodically for any changes. Continued use of the
          app after changes constitutes acceptance of the new terms.
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

const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
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

