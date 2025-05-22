import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from 'styles/theme';
import LottieView from 'lottie-react-native';
import NetInfo from '@react-native-community/netinfo';

const OfflineBanner = ({ visible }) => {
  const [animation] = React.useState(new Animated.Value(visible ? 1 : 0));
  const lottieRef = React.useRef(null);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (visible && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [visible]);

  const handleRetry = () => {
    // Check network connection again
    NetInfo.fetch().then((state) => {
      if (state.isConnected) {
        // If it's connected, the parent component will update visible state
        // You could also add a callback prop like onRetry if needed
      }
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.fullscreenContainer,
        {
          opacity: animation,
        },
      ]}
    >
      <View style={styles.contentContainer}>
        <LottieView
          ref={lottieRef}
          source={require('../../assets/animations/nointernet.json')}
          style={styles.lottieAnimation}
          autoPlay
          loop
        />

        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.message}>
          Quotify requires an internet connection to access quotes, sync your
          favorites, and receive notifications.
        </Text>

        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name='close-circle'
              size={18}
              color={COLORS.error || '#D32F2F'}
            />
            <Text style={styles.featureText}>Fetching new quotes</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name='close-circle'
              size={18}
              color={COLORS.error || '#D32F2F'}
            />
            <Text style={styles.featureText}>Saving favorites</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons
              name='close-circle'
              size={18}
              color={COLORS.error || '#D32F2F'}
            />
            <Text style={styles.featureText}>Account synchronization</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name='refresh' size={20} color='#FFF' />
          <Text style={styles.retryText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFF', // Or COLORS.background for theme support
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text || '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary || '#555',
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresList: {
    width: '100%',
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.text || '#000',
  },
  retryButton: {
    backgroundColor: COLORS.primary || '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OfflineBanner;

