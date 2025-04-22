import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { COLORS } from 'styles/theme';

const BottomSheet = forwardRef(({ children, height = '40%', onClose }, ref) => {
  const [visible, setVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];

  // Convert percentage height to actual pixel value
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = height.endsWith('%')
    ? screenHeight * (parseInt(height) / 100)
    : parseInt(height);

  useImperativeHandle(ref, () => ({
    expand: () => {
      console.log('Custom BottomSheet expand called');
      setVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    close: () => {
      console.log('Custom BottomSheet close called');
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
      console.log('Custom BottomSheet openBottomSheet called');
      setVisible(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    closeBottomSheet: () => {
      console.log('Custom BottomSheet closeBottomSheet called');
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    zIndex: 1000,
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
