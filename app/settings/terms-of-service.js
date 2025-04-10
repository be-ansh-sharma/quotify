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

export default function TermsOfService() {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>

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

