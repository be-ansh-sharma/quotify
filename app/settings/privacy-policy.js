import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';
import Header from 'components/header/Header';

export default function PrivacyPolicy() {
  const { COLORS } = useAppTheme();
  const styles = getStyles(COLORS);

  return (
    <View style={styles.container}>
      <Header title='Privacy Policy' backRoute='/settings' />
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
          {'\n'}- Personal information (such as your name, email address, or
          profile photo)
          {'\n'}- Usage data (such as app interactions, preferences, and
          analytics)
          {'\n'}- Device information (such as device type, operating system, and
          unique identifiers)
        </Text>

        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.text}>
          We use your information to:
          {'\n'}- Provide, maintain, and improve our services
          {'\n'}- Personalize your experience and content
          {'\n'}- Communicate with you about updates, features, and promotions
          {'\n'}- Ensure the security and integrity of our app
        </Text>

        <Text style={styles.sectionTitle}>Sharing Your Information</Text>
        <Text style={styles.text}>
          We do not sell your personal information. We may share your
          information only:
          {'\n'}- With trusted third-party service providers who help us operate
          and improve the app (such as analytics or cloud hosting)
          {'\n'}- If required by law, regulation, or legal process
          {'\n'}- To protect the rights, property, or safety of Quotify, our
          users, or others
        </Text>

        <Text style={styles.sectionTitle}>Data Security</Text>
        <Text style={styles.text}>
          We implement reasonable security measures to protect your information.
          However, no method of transmission over the internet or electronic
          storage is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.text}>
          You have the right to:
          {'\n'}- Access and update your personal information
          {'\n'}- Request deletion of your data
          {'\n'}- Opt out of certain data collection practices (such as
          analytics or marketing communications)
        </Text>

        <Text style={styles.sectionTitle}>Children's Privacy</Text>
        <Text style={styles.text}>
          Quotify is not intended for children under 13. We do not knowingly
          collect personal information from children under 13. If you believe we
          have collected such information, please contact us.
        </Text>

        <Text style={styles.sectionTitle}>Changes to This Policy</Text>
        <Text style={styles.text}>
          We may update this Privacy Policy from time to time. We encourage you
          to review it periodically for any changes. Continued use of the app
          after changes constitutes acceptance of the new policy.
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

