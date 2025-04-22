import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import BottomSheet from 'components/shared/BottomSheet'; // Use our custom BottomSheet
import { COLORS } from 'styles/theme';
import { FontAwesome } from '@expo/vector-icons'; // For icons

const ShareSheet = forwardRef(({ onShareAsText, onShareAsPhoto }, ref) => {
  const bottomSheetRef = useRef(null);

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

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingVertical: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
});

export default ShareSheet;

