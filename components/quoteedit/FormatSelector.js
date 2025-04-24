import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS } from 'styles/theme';

const FormatSelector = ({ formats, selectedFormat, setSelectedFormat }) => {
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
            <View
              style={[
                styles.formatPreviewContainer, // Add this wrapper container
              ]}
            >
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

const styles = StyleSheet.create({
  section: {
    marginBottom: 25, // Increase bottom margin to prevent cutoff
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginHorizontal: 20,
  },
  formatScrollContainer: {
    maxHeight: 120, // Increase from 100 to 120
    marginBottom: 10, // Add additional bottom margin
  },
  formatScrollContent: {
    paddingHorizontal: 16,
  },
  formatOption: {
    alignItems: 'center',
    width: 90,
    marginRight: 12,
    marginBottom: 10, // Add some bottom margin
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden', // Add this to prevent content from spilling out
  },
  selectedFormat: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: `${COLORS.primary}10`,
  },
  formatPreviewContainer: {
    width: '100%', // Full width of parent
    height: 60, // Fixed height container
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Important - prevents overflow
  },
  formatPreview: {
    width: '90%', // Slightly less than container width
    height: undefined, // Height determined by aspect ratio
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    maxHeight: 50, // Add max height
  },
  formatName: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 6,
    height: 30, // Increase height to accommodate text
    width: '100%', // Full width
    paddingHorizontal: 2,
  },
});

export default FormatSelector;

