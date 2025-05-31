import React from 'react';
import { Text, StyleSheet } from 'react-native';
// Change this import
import { useAppTheme } from 'context/AppThemeContext';

/**
 * Enhanced text formatting for quotes that:
 * 1. Capitalizes the first letter of the quote
 * 2. Keeps "I" capitalized throughout the text
 * 3. Capitalizes first word of each sentence
 * 4. Preserves existing capitalization of proper nouns
 */
function formatQuoteText(text) {
  if (!text) return '';

  // First capitalize the first character of the quote
  let result = text.charAt(0).toUpperCase() + text.slice(1);

  // Ensure all standalone "i" are capitalized
  result = result.replace(/(\s|^)i(\s|$|[.,!?;:])/g, '$1I$2');

  // Capitalize first letter after sentence endings
  result = result.replace(
    /([.!?]\s+)([a-z])/g,
    (match, punctuation, letter) => {
      return punctuation + letter.toUpperCase();
    }
  );

  return result;
}

function TileContent({ quote }) {
  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

  // Format the quote text with enhanced formatting
  const formattedText = formatQuoteText(quote.text);

  return <Text style={styles.text}>{formattedText}</Text>;
}

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      marginBottom: 8, // Reduced spacing
    },
    text: {
      fontSize: 15, // Slightly reduced if it was larger
      color: COLORS.onSurface,
      lineHeight: 22, // Optimized line height
    },
  });

export default React.memo(TileContent);

