import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { TextInput, Button, Switch } from 'react-native-paper';
import { useRouter } from 'expo-router';
// Change this import
import { useAppTheme } from 'context/AppThemeContext';
import {
  addQuoteToPendingList,
  addQuote,
  countUserPrivateQuotes,
} from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import Header from 'components/header/Header'; // Import the reusable Header component

export default function PostQuote() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [quoteText, setQuoteText] = useState('');
  const [author, setAuthor] = useState(user?.name || '');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false); // New state for private/public toggle
  const [loading, setLoading] = useState(false);
  const [privateQuoteCount, setPrivateQuoteCount] = useState(0); // New state for private quote count

  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

  const handlePostQuote = async () => {
    if (!quoteText.trim() || !author.trim()) {
      SnackbarService.show('Please fill in both the quote and the author.');
      return;
    }

    setLoading(true);
    try {
      if (isPrivate) {
        // Check if the user has reached the private quote limit
        const count = await countUserPrivateQuotes(user?.uid);
        setPrivateQuoteCount(count);
        if (count >= 20) {
          SnackbarService.show(
            'You have reached the limit of 100 private quotes. Please delete some quotes or upgrade to Pro for more space.'
          );
          setLoading(false);
          return;
        }
      }

      const quoteData = {
        text: quoteText.trim(),
        author: author.trim(),
        shares: 0,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        createdAt: new Date().toISOString(),
        userId: user?.uid || null,
        userQuote: true,
        approved: !isPrivate, // Only public quotes need admin approval
        visibility: isPrivate ? 'private' : 'public', // Set visibility based on toggle
      };

      if (isPrivate) {
        await addQuote(quoteData); // Add to "quotes" collection
        SnackbarService.show('Quote saved privately!');
      } else {
        await addQuoteToPendingList(quoteData); // Add to "pendingquotes" collection
        SnackbarService.show('Quote submitted! It’ll be reviewed soon.');
      }

      router.push('/home');
    } catch (error) {
      SnackbarService.show('Failed to submit the quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Use the reusable Header component */}
      <Header title='Share Your Quote' backRoute='/home' />

      {/* Content Section */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Inspire others. Your quote will be reviewed before publishing.
        </Text>

        <TextInput
          label='Quote'
          value={quoteText}
          onChangeText={setQuoteText}
          multiline
          numberOfLines={4}
          style={styles.input}
          theme={{
            colors: { text: COLORS.text, placeholder: COLORS.placeholder },
          }}
        />

        <TextInput
          label='Author'
          value={author}
          onChangeText={setAuthor}
          style={styles.input}
          theme={{
            colors: { text: COLORS.text, placeholder: COLORS.placeholder },
          }}
        />

        <TextInput
          label='Tags (e.g., motivation, life)'
          value={tags}
          onChangeText={setTags}
          style={styles.input}
          theme={{
            colors: { text: COLORS.text, placeholder: COLORS.placeholder },
          }}
        />

        {/* Private/Public Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Make Quote Private</Text>
          <Switch
            value={isPrivate}
            onValueChange={(value) => setIsPrivate(value)}
            color={COLORS.primary}
          />
        </View>

        {/* Inform the user about rejected quotes */}
        {!isPrivate && (
          <Text style={styles.rejectionNote}>
            If your quote is rejected, it will be converted to a private quote.
          </Text>
        )}

        {/* Warning for Public Quotes */}
        {!isPrivate && (
          <Text style={styles.note}>
            ✨ No spam or profanity. All submissions are reviewed by admins.
          </Text>
        )}

        {/* Private Quote Limit Message */}
        {isPrivate && privateQuoteCount >= 100 && (
          <View style={styles.limitMessage}>
            <Text style={styles.limitText}>
              You have reached the limit of 100 private quotes. Delete some
              quotes or upgrade to Pro for more space.
            </Text>
            <Button
              mode='contained'
              onPress={() => router.push('/pro')}
              style={styles.upgradeButton}
            >
              Upgrade to Pro
            </Button>
          </View>
        )}

        <Button
          mode='contained'
          onPress={handlePostQuote}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Submit Quote
        </Button>

        <Button
          mode='text'
          onPress={() => router.back()}
          style={styles.cancelButton}
          textColor={COLORS.placeholder}
        >
          Cancel
        </Button>
      </View>
    </View>
  );
}

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    content: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: COLORS.placeholder,
      marginBottom: 24,
      textAlign: 'center',
    },
    input: {
      marginBottom: 16,
      backgroundColor: 'transparent',
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    toggleLabel: {
      fontSize: 16,
      color: COLORS.text,
    },
    rejectionNote: {
      fontSize: 12,
      color: COLORS.placeholder,
      marginBottom: 16,
      textAlign: 'center',
    },
    note: {
      fontSize: 12,
      color: COLORS.placeholder,
      marginBottom: 24,
      textAlign: 'center',
    },
    limitMessage: {
      marginTop: 16,
      padding: 16,
      backgroundColor: COLORS.surface,
      borderRadius: 8,
      alignItems: 'center',
    },
    limitText: {
      fontSize: 14,
      color: COLORS.placeholder,
      textAlign: 'center',
      marginBottom: 8,
    },
    upgradeButton: {
      marginTop: 8,
      borderRadius: 8,
    },
    button: {
      marginTop: 8,
      borderRadius: 8,
    },
    cancelButton: {
      marginTop: 12,
    },
  });

