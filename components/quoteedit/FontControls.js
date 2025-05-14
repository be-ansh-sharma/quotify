import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  Platform,
  FlatList,
} from 'react-native';
import Slider from '@react-native-community/slider';
import ColorPicker from 'react-native-wheel-color-picker';
import { useAppTheme } from 'context/AppThemeContext'; // Replace static COLORS import
import { FontAwesome } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define default color presets
const DEFAULT_COLORS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#F44336', // Red
  '#FFEB3B', // Yellow
  '#FFC107', // Amber
  '#FF9800', // Orange
  '#FF5722', // Deep Orange
];

// Define font options with unique IDs
const FONT_OPTIONS = [
  {
    id: 'arial',
    name: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
    displayName: 'Arial',
  },
  // Remove Georgia as it's not working well
  {
    id: 'times',
    name: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    displayName: 'Times',
  },
  {
    id: 'courier',
    name: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    displayName: 'Courier',
  },
  {
    id: 'verdana',
    name: Platform.OS === 'ios' ? 'Verdana' : 'sans-serif-condensed',
    displayName: 'Verdana',
  },
  // Add these elegant quote-friendly fonts
  {
    id: 'palatino',
    name: Platform.OS === 'ios' ? 'Palatino' : 'serif',
    displayName: 'Palatino',
  },
  {
    id: 'avenir',
    name: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif-medium',
    displayName: 'Avenir',
  },
];

const FontControls = ({ typography, onUpdateTypography }) => {
  const { COLORS } = useAppTheme(); // Get colors from theme context
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [tempColor, setTempColor] = useState(typography.color);

  // Correctly initialize selectedFontId
  const [selectedFontId, setSelectedFontId] = useState(() => {
    // Find the font ID that matches current typography
    const currentFont = FONT_OPTIONS.find(
      (font) => font.name === typography.font
    );
    return currentFont ? currentFont.id : FONT_OPTIONS[0].id; // Default to first font if not found
  });

  // Create styles with current theme colors
  const styles = getStyles(COLORS);

  const handleColorChange = (color) => {
    setTempColor(color);
  };

  const applyColor = () => {
    onUpdateTypography('color', tempColor);
    setColorPickerVisible(false);
  };

  const selectDefaultColor = (color) => {
    setTempColor(color);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Font Family Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Font</Text>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FONT_OPTIONS}
          contentContainerStyle={styles.fontListContainer}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedFontId === item.id;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  onUpdateTypography('font', item.name);
                  setSelectedFontId(item.id);
                }}
                style={[styles.fontOption, isSelected && styles.selectedFont]}
              >
                <Text style={[styles.fontSample, { fontFamily: item.name }]}>
                  Aa
                </Text>
                <Text style={styles.fontName}>{item.displayName}</Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Optional: Pagination dots */}
        <View style={styles.fontPagination}>
          {FONT_OPTIONS.map((font) => (
            <View
              key={font.id}
              style={[
                styles.fontPaginationDot,
                selectedFontId === font.id && styles.fontPaginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Font Size Control */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Size: {Math.round(typography.size)}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={12}
          maximumValue={48}
          step={1}
          value={typography.size}
          onValueChange={(value) => onUpdateTypography('size', value)}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor='#DDDDDD'
          thumbTintColor={COLORS.primary}
        />
      </View>

      {/* Color Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color</Text>
        <TouchableOpacity
          style={[styles.colorPreview, { backgroundColor: typography.color }]}
          onPress={() => setColorPickerVisible(true)}
        >
          <FontAwesome
            name='eyedropper'
            size={18}
            color={isLightColor(typography.color) ? '#000' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* Color Picker Modal */}
      <Modal
        visible={colorPickerVisible}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setColorPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.colorPickerContainer}>
            <Text style={styles.modalTitle}>Select Text Color</Text>

            {/* Default Color Swatches */}
            <View style={styles.colorSwatchesContainer}>
              {DEFAULT_COLORS.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: color },
                    tempColor.toUpperCase() === color.toUpperCase() &&
                      styles.selectedSwatch,
                  ]}
                  onPress={() => selectDefaultColor(color)}
                >
                  {tempColor.toUpperCase() === color.toUpperCase() && (
                    <FontAwesome
                      name='check'
                      size={12}
                      color={isLightColor(color) ? '#000' : '#fff'}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.pickerWrapper}>
              <ColorPicker
                color={tempColor}
                onColorChange={handleColorChange}
                thumbSize={35} // Slightly smaller thumb
                sliderSize={35} // Slightly smaller slider
                noSnap={true}
                row={false}
                swatches={false}
                // Decreased height to prevent overlap
                style={{ width: SCREEN_WIDTH * 0.7, height: 240 }} // Decreased from 300 to 240
              />
            </View>

            <View style={styles.colorPreviewRow}>
              <View
                style={[
                  styles.colorPreviewLarge,
                  { backgroundColor: tempColor },
                ]}
              />
              <View style={styles.colorInfoContainer}>
                <Text style={styles.colorInfoLabel}>Selected Color</Text>
                <Text style={styles.colorHexText}>
                  {tempColor.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setColorPickerVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={applyColor}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Helper function to determine if a color is light or dark
const isLightColor = (color) => {
  // Convert hex to RGB
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate perceived brightness using the formula: (0.299*R + 0.587*G + 0.114*B)
  const brightness = r * 0.299 + g * 0.587 + b * 0.114;

  // Return true if the color is light (brightness > 150)
  return brightness > 150;
};

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
      color: COLORS.text,
    },
    fontContainer: {
      paddingVertical: 15,
      paddingHorizontal: 10,
    },
    fontOption: {
      width: 80,
      height: 90,
      marginRight: 15,
      borderRadius: 8,
      backgroundColor: COLORS.surface,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      borderWidth: 1,
      borderColor: COLORS.border || '#DDD',
    },
    selectedFont: {
      borderColor: COLORS.primary,
      backgroundColor: `${COLORS.primary}10`,
    },
    fontLabel: {
      fontSize: 16,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    colorPreview: {
      width: 60,
      height: 40,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border || '#DDD',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorPickerContainer: {
      width: SCREEN_WIDTH * 0.85,
      backgroundColor: COLORS.surface,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      elevation: 5,
      shadowColor: COLORS.shadow || '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      maxHeight: SCREEN_WIDTH * 1.4, // Increased height to accommodate all elements
    },
    pickerWrapper: {
      width: SCREEN_WIDTH * 0.7,
      height: 240, // Adjusted height
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10, // Add margin at bottom
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: COLORS.text,
    },
    colorPreviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      marginBottom: 20,
      backgroundColor: COLORS.surface,
      padding: 10,
      borderRadius: 8,
      width: '100%',
    },
    colorPreviewLarge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
      borderWidth: 1,
      borderColor: COLORS.border || '#DDD',
    },
    colorHexText: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 20,
    },
    modalButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
      width: '48%',
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: COLORS.surface,
    },
    cancelButtonText: {
      color: COLORS.text,
      fontWeight: '600',
    },
    applyButton: {
      backgroundColor: COLORS.primary,
    },
    applyButtonText: {
      color: COLORS.onPrimary || '#fff',
      fontWeight: '600',
    },
    colorSwatchesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 10,
      width: '100%',
    },
    colorSwatch: {
      width: 30,
      height: 30,
      borderRadius: 15,
      margin: 4,
      borderWidth: 1,
      borderColor: COLORS.border || '#DDD',
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedSwatch: {
      borderWidth: 2,
      borderColor: COLORS.primary,
    },
    divider: {
      height: 1,
      backgroundColor: COLORS.border || '#e0e0e0',
      width: '100%',
      marginVertical: 10,
    },
    colorInfoContainer: {
      flex: 1,
    },
    colorInfoLabel: {
      fontSize: 12,
      color: COLORS.textSecondary || '#666',
      marginBottom: 2,
    },
    fontCarousel: {
      marginVertical: 10,
      width: '100%',
    },
    fontCarouselItem: {
      height: 80,
      width: SCREEN_WIDTH * 0.3, // Make items take 30% of screen width
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      borderWidth: 1,
      marginHorizontal: 5,
    },
    fontSample: {
      fontSize: 24,
      marginBottom: 5,
      color: COLORS.text, // Ensure font sample is visible
    },
    fontName: {
      fontSize: 12,
      textAlign: 'center',
      color: COLORS.text, // Ensure font name is visible
    },
    fontListContainer: {
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    fontPagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 8,
    },
    fontPaginationDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: COLORS.border || '#DDD',
      marginHorizontal: 3,
    },
    fontPaginationDotActive: {
      backgroundColor: COLORS.primary,
    },
  });

export default FontControls;

