import React, { useState } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { TextInput, Button, Switch } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAppTheme } from 'context/AppThemeContext';
import {
  addQuoteToPendingList,
  addQuote,
  countUserPrivateQuotes,
  updateUserPrivateQuotes,
} from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { showMessage } from 'react-native-flash-message';
import Header from 'components/header/Header';
import { FontAwesome5 } from '@expo/vector-icons';

export default function PostQuote() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [quoteText, setQuoteText] = useState('');
  const [author, setAuthor] = useState(user?.name || '');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [privateQuoteCount, setPrivateQuoteCount] = useState(0);
  const [errors, setErrors] = useState({
    quote: null,
    author: null,
    tags: null,
  });

  // Define limits based on Pro status
  const PRIVATE_QUOTE_LIMIT = user?.isPro ? 500 : 10;

  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

  const validateTags = (tagString) => {
    // Split by commas and process each tag
    const tagArray = tagString.split(',').map((tag) => tag.trim());

    // Check each tag
    const invalidTags = tagArray.filter((tag) => {
      // Skip empty tags
      if (!tag) return false;

      // Only allow letters and hyphens in each tag
      return !/^[a-zA-Z\-\s]+$/.test(tag);
    });

    if (invalidTags.length > 0) {
      return {
        valid: false,
        message: `Invalid tags: ${invalidTags.join(
          ', '
        )}. Tags can only contain letters, spaces and hyphens.`,
      };
    }

    return { valid: true };
  };

  const validateAuthor = (authorName) => {
    // Check if author name contains numbers or invalid special characters
    if (/[0-9]/.test(authorName)) {
      return {
        valid: false,
        message: "Author name shouldn't contain numbers.",
      };
    }

    // Only allow letters, spaces, and certain punctuation in names
    if (!/^[a-zA-Z\s.\-']+$/.test(authorName)) {
      return {
        valid: false,
        message:
          'Author name contains invalid characters. Only letters, spaces, hyphens, apostrophes, and periods are allowed.',
      };
    }

    return { valid: true };
  };

  const validateQuoteText = (text) => {
    // Check minimum length
    if (text.length < 10) {
      return {
        valid: false,
        message: 'Quote is too short. Please enter at least 10 characters.',
      };
    }

    // Check maximum length
    if (text.length > 300) {
      return {
        valid: false,
        message: 'Quote is too long. Please keep it under 300 characters.',
      };
    }

    // Check for excessive repeated characters
    if (/(.)\1{4,}/.test(text)) {
      return {
        valid: false,
        message: 'Quote contains excessive repeated characters.',
      };
    }

    // NEW: Check that the quote has enough letters (not just special characters)
    const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < 10) {
      return {
        valid: false,
        message: 'Quote should contain at least 10 letters.',
      };
    }

    // NEW: Check for excessive special characters
    if (/[^a-zA-Z0-9\s.,!?;:'"()\-–—]{5,}/.test(text)) {
      return {
        valid: false,
        message: 'Quote contains too many consecutive special characters.',
      };
    }

    // NEW: Check letter ratio (at least 30% of characters should be letters)
    const letterRatio = letterCount / text.length;
    if (letterRatio < 0.3) {
      return {
        valid: false,
        message:
          'Quote should be primarily text rather than special characters.',
      };
    }

    return { valid: true };
  };

  const handlePostQuote = async () => {
    // Trim all inputs first
    const trimmedQuote = quoteText.trim();
    const trimmedAuthor = author.trim();
    const trimmedTags = tags.trim();

    // Basic validation
    if (!trimmedQuote || !trimmedAuthor) {
      showMessage({
        message: 'Please fill in both the quote and the author.',
        type: 'warning',
      });
      return;
    }

    // Validate quote text
    const quoteValidation = validateQuoteText(trimmedQuote);
    if (!quoteValidation.valid) {
      showMessage({
        message: quoteValidation.message,
        type: 'warning',
      });
      return;
    }

    // Validate author
    const authorValidation = validateAuthor(trimmedAuthor);
    if (!authorValidation.valid) {
      showMessage({
        message: authorValidation.message,
        type: 'warning',
      });
      return;
    }

    // Validate tags
    if (trimmedTags) {
      const tagsValidation = validateTags(trimmedTags);
      if (!tagsValidation.valid) {
        showMessage({
          message: tagsValidation.message,
          type: 'warning',
        });
        return;
      }
    }

    setLoading(true);
    try {
      if (isPrivate) {
        // Check if the user has reached the private quote limit
        const count = await countUserPrivateQuotes(user?.uid);
        setPrivateQuoteCount(count);
        if (count >= PRIVATE_QUOTE_LIMIT) {
          Alert.alert(
            'Private Quote Limit Reached',
            `You've reached your limit of ${PRIVATE_QUOTE_LIMIT} private quotes.${
              !user?.isPro
                ? '\nUpgrade to Pro for 500 private quotes!'
                : '\nPlease delete some quotes to add more.'
            }`,
            [
              { text: 'Cancel', style: 'cancel' },
              ...(!user?.isPro
                ? [
                    {
                      text: 'Upgrade',
                      onPress: () => router.push('/profile/pro/'),
                      style: 'default',
                    },
                  ]
                : []),
            ]
          );
          setLoading(false);
          return;
        }
      }

      // Process tags properly
      const processedTags = trimmedTags
        ? trimmedTags
            .split(',')
            .map((tag) => tag.trim().toLowerCase()) // Normalize tags to lowercase
            .filter(Boolean)
        : [];

      const quoteData = {
        text: trimmedQuote,
        author: trimmedAuthor,
        shares: 0,
        tags: processedTags,
        createdAt: new Date().toISOString(),
        userId: user?.uid || null,
        userQuote: true,
        approved: !isPrivate, // Only public quotes need admin approval
        visibility: isPrivate ? 'private' : 'public', // Set visibility based on toggle
      };

      if (isPrivate) {
        try {
          // Add the quote to the quotes collection and get its ID
          const quoteId = await addQuote(quoteData);

          // Update the user document to track this private quote
          if (user?.uid && quoteId) {
            await updateUserPrivateQuotes(user.uid, quoteId);
            console.log(`Added private quote ${quoteId} to user ${user.uid}`);

            // Update the local user store to keep it in sync with Firebase
            const updatedPrivateQuotes = user.privateQuotes
              ? [...user.privateQuotes, quoteId]
              : [quoteId];

            useUserStore.setState({
              user: {
                ...user,
                privateQuotes: updatedPrivateQuotes,
              },
            });

            console.log(
              `Added quote ${quoteId} to user's privateQuotes in local store`
            );
          }

          showMessage({
            message: 'Quote saved privately!',
          });
        } catch (error) {
          console.error('Error saving private quote:', error);
          showMessage({
            message: 'Failed to save your private quote.',
          });
        }
      } else {
        await addQuoteToPendingList(quoteData); // Add to "pendingquotes" collection
        showMessage({
          message: 'Quote submitted! It’ll be reviewed soon.',
        });
      }

      router.push('/home');
    } catch (error) {
      showMessage({
        message: 'Failed to submit the quote. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteChange = (text) => {
    setQuoteText(text);
    // Only validate if there's some text (don't show errors while typing)
    if (text.length > 5) {
      const validation = validateQuoteText(text.trim());
      if (!validation.valid) {
        setErrors((prev) => ({ ...prev, quote: validation.message }));
      } else {
        setErrors((prev) => ({ ...prev, quote: null }));
      }
    }
  };

  const handleAuthorChange = (text) => {
    setAuthor(text);
    // Only validate if there's some text (don't show errors while typing)
    if (text.length > 5) {
      const validation = validateAuthor(text.trim());
      if (!validation.valid) {
        setErrors((prev) => ({ ...prev, author: validation.message }));
      } else {
        setErrors((prev) => ({ ...prev, author: null }));
      }
    }
  };

  const handleTagsChange = (text) => {
    setTags(text);
    // Only validate if there's some text (don't show errors while typing)
    if (text.length > 5) {
      const validation = validateTags(text.trim());
      if (!validation.valid) {
        setErrors((prev) => ({ ...prev, tags: validation.message }));
      } else {
        setErrors((prev) => ({ ...prev, tags: null }));
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }} // Add background color here
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <Header title='Share Your Quote' backRoute='/home' />

      <ScrollView
        style={{ backgroundColor: COLORS.background }} // Add this line
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps='handled'
      >
        {/* Pro Banner - move it INSIDE the ScrollView but OUTSIDE the container */}
        {!user?.isPro && (
          <View style={styles.topProBanner}>
            <Text style={styles.proBannerTitle}>
              <FontAwesome5 name='crown' size={16} color='#FFD700' /> Unlock
              Quotify Pro for unlimited public & 500 private quotes!
            </Text>
            <TouchableOpacity
              style={styles.proBannerButton}
              onPress={() => router.push('/profile/pro/')}
              activeOpacity={0.85}
            >
              <Text style={styles.proBannerButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Container with form fields */}
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Inspire others. Your quote will be reviewed before publishing.
          </Text>

          <TextInput
            label='Quote'
            value={quoteText}
            onChangeText={handleQuoteChange}
            multiline
            numberOfLines={4}
            style={styles.input}
            error={!!errors.quote}
            theme={{
              colors: {
                primary: COLORS.primary,
                background: COLORS.surface,
                text: COLORS.text,
                placeholder: COLORS.placeholder,
                error: COLORS.error,
              },
            }}
          />
          {errors.quote && <Text style={styles.errorText}>{errors.quote}</Text>}

          <TextInput
            label='Author'
            value={author}
            onChangeText={handleAuthorChange}
            style={styles.input}
            theme={{
              colors: {
                primary: COLORS.primary,
                background: COLORS.surface,
                text: COLORS.text,
                placeholder: COLORS.placeholder,
              },
            }}
          />

          <TextInput
            label='Tags (e.g., motivation, life)'
            value={tags}
            onChangeText={handleTagsChange}
            style={styles.input}
            theme={{
              colors: {
                primary: COLORS.primary,
                background: COLORS.surface,
                text: COLORS.text,
                placeholder: COLORS.placeholder,
              },
            }}
          />

          {/* Private/Public Toggle with Pro indicator */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleLabelContainer}>
              <Text style={styles.toggleLabel}>Make Quote Private</Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={(value) => setIsPrivate(value)}
              color={COLORS.primary}
            />
          </View>

          {/* Private Quote Limit Info */}
          {isPrivate && (
            <Text style={styles.note}>
              You can save up to {PRIVATE_QUOTE_LIMIT} private quotes.
            </Text>
          )}

          {/* Pro Upgrade Banner for free users */}
          {isPrivate && !user?.isPro && privateQuoteCount >= 5 && (
            <View style={styles.proPromotionCard}>
              <View style={styles.proPromotionHeader}>
                <FontAwesome5 name='crown' size={20} color='#FFD700' />
                <Text style={styles.proPromotionTitle}>Need More Space?</Text>
              </View>
              <Text style={styles.proPromotionText}>
                Pro members can save up to 500 private quotes! Upgrade now to
                increase your limit and support the app.
              </Text>
              <Button
                mode='contained'
                onPress={() => router.push('/profile/pro/')} // Fixed path to Pro page
                style={styles.upgradeButton}
              >
                Upgrade to Pro
              </Button>
            </View>
          )}

          {/* Warning for Public Quotes */}
          {!isPrivate && (
            <Text style={styles.note}>
              ✨ No spam or profanity. All submissions are reviewed by admins.
            </Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    content: {
      padding: 20,
      backgroundColor: COLORS.background, // This is already correct
    },
    subtitle: {
      fontSize: 14,
      color: COLORS.placeholder,
      marginBottom: 24,
      textAlign: 'center',
    },
    input: {
      marginBottom: 16,
      backgroundColor: 'transparent', // Change this to match surface color
      // Add these properties for TextInput:
      color: COLORS.text,
      borderColor: COLORS.border,
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
      backgroundColor: COLORS.background, // Add this
    },
    toggleLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    toggleLabel: {
      fontSize: 16,
      color: COLORS.text,
    },
    proBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 12,
      backgroundColor: COLORS.primary,
    },
    proBadgeText: {
      fontSize: 12,
      color: COLORS.background,
      marginLeft: 4,
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
    quotaContainer: {
      marginTop: 16,
      padding: 14,
      borderRadius: 12,
      backgroundColor: COLORS.surface, // This should be surface, not background
      alignItems: 'flex-start',
      shadowColor: COLORS.shadow, // Change from '#000' to COLORS.shadow
      shadowOpacity: 0.04,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      marginBottom: 8,
    },
    quotaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    quotaText: {
      fontSize: 15,
      color: COLORS.text,
      fontWeight: '600',
    },
    quotaNumber: {
      fontWeight: 'bold',
      fontSize: 15,
    },
    quotaSlash: {
      fontSize: 15,
      color: COLORS.placeholder,
    },
    quotaLimit: {
      fontWeight: 'bold',
      fontSize: 15,
      color: COLORS.primary,
    },
    progressBarContainer: {
      height: 10,
      width: '100%',
      borderRadius: 5,
      backgroundColor: COLORS.border,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 5,
      transition: 'width 0.3s',
    },
    proPromotionCard: {
      marginTop: 16,
      padding: 16,
      borderRadius: 8,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
    },
    proPromotionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    proPromotionTitle: {
      fontSize: 16,
      color: COLORS.background,
      marginLeft: 8,
    },
    proPromotionText: {
      fontSize: 14,
      color: COLORS.onPrimary, // Change from COLORS.background to COLORS.onPrimary
      textAlign: 'center',
      marginBottom: 16,
    },
    topProBanner: {
      backgroundColor: COLORS.primary,
      paddingVertical: 22,
      paddingHorizontal: 18,
      marginBottom: 22,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#FFD700',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    proBannerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    proBannerTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: COLORS.onPrimary,
      textAlign: 'center',
      flexDirection: 'row',
      alignItems: 'center',
    },
    proBannerSubtitle: {
      fontSize: 15,
      color: COLORS.onPrimary,
      textAlign: 'center',
      marginBottom: 16,
      marginTop: 2,
      lineHeight: 22,
    },
    proBannerButton: {
      backgroundColor: '#FFD700',
      borderRadius: 24,
      paddingVertical: 10,
      paddingHorizontal: 32,
      marginTop: 2,
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    proBannerButtonText: {
      color: COLORS.primary,
      fontWeight: 'bold',
      fontSize: 16,
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    proFeaturesContainer: {
      alignItems: 'flex-start',
      marginVertical: 8,
      width: '100%',
    },
    proFeaturesTitleSmall: {
      fontSize: 13,
      fontWeight: 'bold',
      color: COLORS.background,
      marginBottom: 4,
    },
    proFeatureTextSmall: {
      fontSize: 12,
      color: COLORS.background,
      marginVertical: 2,
      lineHeight: 18,
    },
    smallUpgradeButton: {
      backgroundColor: COLORS.background,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginTop: 8,
    },
    smallUpgradeButtonText: {
      fontSize: 14,
      color: COLORS.primary,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    errorText: {
      color: COLORS.error,
      fontSize: 12,
      marginTop: -12,
      marginBottom: 12,
      marginLeft: 8,
    },
  });

