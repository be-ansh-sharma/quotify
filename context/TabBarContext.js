import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';
import { Animated, Dimensions } from 'react-native';
import { usePathname } from 'expo-router';

const TabBarContext = createContext();

export const TabBarProvider = ({ children }) => {
  const [visible, setVisible] = useState(true);
  const tabBarHeight = 56; // Match your tab bar height
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;
  const pathname = usePathname(); // Get current route path

  // Show tab bar when navigating to browse or profile
  useEffect(() => {
    if (pathname === '/browse' || pathname === '/profile') {
      showTabBar();
    }
  }, [pathname]);

  const showTabBar = () => {
    setVisible(true);
    Animated.spring(tabBarTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 6, // Lower friction for faster movement
      tension: 40, // Lower tension for more natural feel
      velocity: 1, // Add initial velocity
    }).start();
  };

  const hideTabBar = () => {
    Animated.spring(tabBarTranslateY, {
      toValue: tabBarHeight + 20, // Add extra to ensure it's completely off-screen
      useNativeDriver: true,
      friction: 6, // Lower friction for faster movement
      tension: 40, // Lower tension for more natural feel
      velocity: 1, // Add initial velocity
    }).start(() => {
      // Only set invisible after animation completes
      setVisible(false);
    });
  };

  return (
    <TabBarContext.Provider
      value={{
        visible,
        setVisible,
        tabBarTranslateY,
        showTabBar,
        hideTabBar,
      }}
    >
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBar = () => useContext(TabBarContext);

