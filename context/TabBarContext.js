import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated } from 'react-native';

const TabBarContext = createContext();

export const TabBarProvider = ({ children }) => {
  const [visible, setVisible] = useState(true);
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;

  const showTabBar = () => {
    setVisible(true);
    Animated.spring(tabBarTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  };

  const hideTabBar = () => {
    Animated.spring(tabBarTranslateY, {
      toValue: 60, // Height of tab bar + some extra
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start(() => setVisible(false));
  };

  return (
    <TabBarContext.Provider
      value={{
        visible,
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

