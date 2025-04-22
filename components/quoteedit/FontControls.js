import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

const fonts = ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
const colors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF'];

function FontControls({ typography, onUpdateTypography }) {
  return (
    <>
      {/* Font Selector */}
      <View style={styles.fontSelector}>
        {fonts.map((font, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onUpdateTypography('font', font)}
            style={[
              styles.fontOption,
              typography.font === font && styles.selectedFont,
            ]}
          >
            <Text style={{ fontFamily: font }}>{font}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Color Selector */}
      <View style={styles.colorSelector}>
        {colors.map((color, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onUpdateTypography('color', color)}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              typography.color === color && styles.selectedColor,
            ]}
          />
        ))}
      </View>

      {/* Font Size Slider */}
      <View style={styles.sliderContainer}>
        <Text>Font Size: {typography.size}</Text>
        <Slider
          style={styles.slider}
          minimumValue={12}
          maximumValue={48}
          step={1}
          value={typography.size}
          onValueChange={(value) => onUpdateTypography('size', value)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fontSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fontOption: {
    padding: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedFont: {
    borderColor: '#007BFF',
  },
  colorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#007BFF',
  },
  sliderContainer: {
    marginBottom: 10,
  },
  slider: {
    width: '100%',
  },
});

export default React.memo(FontControls);
