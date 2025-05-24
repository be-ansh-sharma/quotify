import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useAppTheme } from 'context/AppThemeContext';

const BottomSheet = forwardRef(({ children, height = '40%', onClose }, ref) => {
  const { COLORS } = useAppTheme(); // Get theme colors dynamically
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];

  // Convert percentage height to actual pixel value
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = height.endsWith('%')
    ? screenHeight * (parseInt(height) / 100)
    : parseInt(height);

  useImperativeHandle(ref, () => ({
    expand: () => {
      setVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    close: () => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        if (onClose) onClose();
      });
    },
    openBottomSheet: () => {
      setVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    closeBottomSheet: () => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        if (onClose) onClose();
      });
    },
  }));

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [modalHeight, 0],
  });

  if (!visible) return null;

  const styles = getStyles(COLORS); // Generate styles dynamically

  return (
    <Modal transparent visible={visible} animationType='none'>
      <TouchableWithoutFeedback onPress={() => ref.current.close()}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                { height: modalHeight, transform: [{ translateY }] },
              ]}
            >
              <View style={styles.handle} />
              <View style={styles.content}>{children}</View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

const getStyles = (COLORS) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.2)', // was 0.5, try 0.2 or 0.1
      justifyContent: 'flex-end',
      zIndex: 100,
    },
    container: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      zIndex: 100,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: COLORS.placeholder,
      alignSelf: 'center',
      borderRadius: 2,
      marginBottom: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
  });

export default BottomSheet;

