import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { COLORS } from 'styles/theme';
import { addQuote } from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome for the back icon

export default function PostQuote() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [quoteText, setQuoteText] = useState('');
  const [author, setAuthor] = useState(user?.name || '');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePostQuote = async () => {
    if (!quoteText.trim() || !author.trim()) {
      SnackbarService.show('Please fill in both the quote and the author.');
      return;
    }

    setLoading(true);
    try {
      const quoteData = {
        text: quoteText.trim(),
        author: author.trim(),
        likes: 0,
        shares: 0,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        createdAt: new Date().toISOString(),
        userId: user?.uid || null,
        approved: false,
      };

      await addQuote(quoteData);

      SnackbarService.show('Quote submitted! It’ll be reviewed soon.');
      router.push('/home');
    } catch (error) {
      SnackbarService.show('Failed to submit the quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name='arrow-left' size={20} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Your Quote</Text>
      </View>

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

        <Text style={styles.note}>
          ✨ No spam or profanity. All submissions are reviewed by admins.
        </Text>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
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
  note: {
    fontSize: 12,
    color: COLORS.placeholder,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  cancelButton: {
    marginTop: 12,
  },
});

