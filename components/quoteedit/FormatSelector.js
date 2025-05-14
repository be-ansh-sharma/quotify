import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from 'context/AppThemeContext'; // Import theme context

const FormatSelector = ({ formats, selectedFormat, setSelectedFormat }) => {
  const { COLORS } = useAppTheme(); // Get theme colors
  const styles = getStyles(COLORS);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Share Format</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.formatScrollContainer}
        contentContainerStyle={styles.formatScrollContent}
      >
        {formats.map((format) => (
          <TouchableOpacity
            key={format.id}
            style={[
              styles.formatOption,
              selectedFormat.id === format.id && styles.selectedFormat,
            ]}
            onPress={() => setSelectedFormat(format)}
          >
            <View style={styles.formatPreviewContainer}>
              <View
                style={[
                  styles.formatPreview,
                  { aspectRatio: format.aspectRatio },
                ]}
              />
            </View>
            <Text
              style={styles.formatName}
              numberOfLines={2}
              ellipsizeMode='tail'
            >
              {format.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const getStyles = (COLORS) =>
  StyleSheet.create({
    section: {
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
      marginHorizontal: 20,
      color: COLORS.text, // Use theme text color
    },
    formatScrollContainer: {
      maxHeight: 120,
      marginBottom: 10,
    },
    formatScrollContent: {
      paddingHorizontal: 16,
    },
    formatOption: {
      alignItems: 'center',
      width: 90,
      marginRight: 12,
      marginBottom: 10,
      padding: 8,
      borderWidth: 1,
      borderColor: COLORS.border, // Use theme border color
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: COLORS.surface, // Use theme surface color
    },
    selectedFormat: {
      borderColor: COLORS.primary, // Highlight selected format
      borderWidth: 2,
      backgroundColor: `${COLORS.primary}10`, // Subtle background for selected format
    },
    formatPreviewContainer: {
      width: '100%',
      height: 60,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    formatPreview: {
      width: '90%',
      height: undefined,
      backgroundColor: COLORS.backgroundSecondary, // Use theme secondary background
      borderRadius: 4,
      maxHeight: 50,
    },
    formatName: {
      fontSize: 9,
      textAlign: 'center',
      marginTop: 6,
      height: 30,
      width: '100%',
      paddingHorizontal: 2,
      color: COLORS.textSecondary || COLORS.text, // Use theme secondary text color
    },
  });

export default FormatSelector;

