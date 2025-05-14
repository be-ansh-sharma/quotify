import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import BottomSheet from 'components/shared/BottomSheet'; // Use our custom BottomSheet
import { FontAwesome } from '@expo/vector-icons'; // For icons
import { useAppTheme } from 'context/AppThemeContext'; // Import theme context

const ShareSheet = forwardRef(({ onShareAsText, onShareAsPhoto }, ref) => {
  const bottomSheetRef = useRef(null);
  const { COLORS } = useAppTheme(); // Get theme colors

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openBottomSheet: () => {
      bottomSheetRef.current?.expand();
    },
    closeBottomSheet: () => {
      bottomSheetRef.current?.close();
    },
  }));

  // Define share options
  const shareOptions = [
    {
      id: 'text',
      label: 'Share as Text',
      icon: 'font',
      onPress: onShareAsText,
    },
    {
      id: 'photo',
      label: 'Share as Photo',
      icon: 'camera',
      onPress: onShareAsPhoto,
    },
  ];

  const styles = getStyles(COLORS);

  return (
    <BottomSheet ref={bottomSheetRef} height='30%'>
      <View style={styles.content}>
        <FlatList
          data={shareOptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.option} onPress={item.onPress}>
              <FontAwesome
                name={item.icon}
                size={20}
                color={COLORS.primary}
                style={styles.icon}
              />
              <Text style={styles.optionText}>{item.label}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </BottomSheet>
  );
});

const getStyles = (COLORS) =>
  StyleSheet.create({
    content: {
      flex: 1,
      paddingVertical: 16,
      backgroundColor: COLORS.background, // Use theme background color
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: COLORS.surface, // Use theme surface color
      borderRadius: 8,
      marginHorizontal: 16,
      marginBottom: 8,
    },
    icon: {
      marginRight: 12,
    },
    optionText: {
      fontSize: 16,
      color: COLORS.text, // Use theme text color
      fontWeight: '500',
    },
    separator: {
      height: 1,
      backgroundColor: COLORS.border, // Use theme border color
      marginHorizontal: 16,
    },
  });

export default ShareSheet;

