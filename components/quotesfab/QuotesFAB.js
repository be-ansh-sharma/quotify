import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAppTheme } from 'context/AppThemeContext'; // Replace static COLORS import
import { Modal, Portal, Text as PaperText } from 'react-native-paper';
import QuoteOfTheDay from './QuoteOfTheDay';
import TopQuote from './TopQuote';
import RandomQuote from './RandomQuote';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuotesFAB() {
  const { COLORS } = useAppTheme(); // Get colors from theme context
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeQuote, setActiveQuote] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Generate styles with current theme colors
  const styles = getStyles(COLORS);

  const openQuoteModal = (quoteType) => {
    animation.setValue(0);
    setIsOpen(false);
    setActiveQuote(quoteType);
    requestAnimationFrame(() => {
      setShowModal(true);
    });
  };

  useEffect(() => {
    let timerId;
    if (isOpen) {
      timerId = setTimeout(() => {
        if (isOpen) {
          animation.setValue(0);
          setIsOpen(false);
        }
      }, 8000);
    }
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isOpen]);

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    animation.setValue(toValue);
    setIsOpen(!isOpen);
  };

  const closeEverything = () => {
    setActiveQuote(null);
    setShowModal(false);
    animation.setValue(0);
    setIsOpen(false);
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });
  const dailyQuoteTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });
  const topQuoteTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  });
  const randomQuoteTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  const renderActualContent = () => {
    switch (activeQuote) {
      case 'daily':
        return <QuoteOfTheDay />;
      case 'top':
        return <TopQuote />;
      case 'random':
        return <RandomQuote />;
      default:
        return null;
    }
  };

  return (
    <>
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}
      <View
        style={[
          styles.fabContainer,
          { bottom: 70 + insets.bottom }, // Tab height (56) + padding + safe area
        ]}
      >
        <Animated.View
          style={[
            styles.fabItem,
            {
              transform: [{ translateY: randomQuoteTranslateY }],
              opacity: animation,
            },
          ]}
        >
          <View style={styles.fabItemLabel}>
            <Text
              style={styles.fabItemText}
              numberOfLines={1}
              ellipsizeMode='clip' // Prevent ellipsis from appearing
            >
              Random
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.fabItemButton,
              { backgroundColor: COLORS.accent2 || '#9C27B0' },
            ]}
            onPress={() => openQuoteModal('random')}
          >
            <FontAwesome
              name='random'
              size={18}
              color={COLORS.onAccent2 || '#fff'}
            />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={[
            styles.fabItem,
            {
              transform: [{ translateY: topQuoteTranslateY }],
              opacity: animation,
            },
          ]}
        >
          <View style={styles.fabItemLabel}>
            <Text style={styles.fabItemText}>Top</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.fabItemButton,
              { backgroundColor: COLORS.accent1 || '#FF9800' },
            ]}
            onPress={() => openQuoteModal('top')}
          >
            <FontAwesome
              name='trophy'
              size={18}
              color={COLORS.onAccent1 || '#fff'}
            />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={[
            styles.fabItem,
            {
              transform: [{ translateY: dailyQuoteTranslateY }],
              opacity: animation,
            },
          ]}
        >
          <View style={styles.fabItemLabel}>
            <Text style={styles.fabItemText}>Daily</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.fabItemButton,
              { backgroundColor: COLORS.tertiary || '#4CAF50' },
            ]}
            onPress={() => openQuoteModal('daily')}
          >
            <FontAwesome
              name='calendar'
              size={18}
              color={COLORS.onTertiary || '#fff'}
            />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <TouchableOpacity
            style={styles.fab}
            onPress={toggleMenu}
            activeOpacity={0.8}
          >
            <FontAwesome
              name='quote-left'
              size={24}
              color={COLORS.onPrimary || '#fff'}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Portal>
        <Modal
          visible={showModal}
          onDismiss={closeEverything}
          contentContainerStyle={styles.paperModalContent}
        >
          <View style={styles.modalHeaderPaper}>
            <PaperText variant='titleMedium' style={styles.modalTitlePaper}>
              {activeQuote === 'daily'
                ? 'Quote of the Day'
                : activeQuote
                ? activeQuote.charAt(0).toUpperCase() + activeQuote.slice(1)
                : 'Quote'}
            </PaperText>
            <TouchableOpacity onPress={closeEverything} style={{ padding: 8 }}>
              <FontAwesome
                name='close'
                size={22}
                color={COLORS.onPrimary || '#ffffff'}
              />
            </TouchableOpacity>
          </View>
          {activeQuote ? (
            <ScrollView
              style={styles.modalBodyScrollView}
              contentContainerStyle={styles.modalBodyContentContainer}
              key={activeQuote}
            >
              {renderActualContent()}
            </ScrollView>
          ) : (
            <View style={styles.modalBodyContentContainer}>
              <PaperText style={{ textAlign: 'center' }}></PaperText>
            </View>
          )}
        </Modal>
      </Portal>
    </>
  );
}

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 998,
    },
    fabContainer: {
      position: 'absolute',
      bottom: 25,
      right: 25,
      alignItems: 'flex-end',
      zIndex: 999,
    },
    fab: {
      backgroundColor: COLORS.primary || '#6200ee',
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    fabItem: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      right: 4,
      justifyContent: 'flex-end',
    },
    fabItemButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      marginLeft: 10,
    },
    fabItemLabel: {
      backgroundColor: COLORS.surfaceVariant || '#E1E1E1',
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 5,
      minWidth: 80, // Increased from 60 to 80 to fit "Random" text
      borderWidth: 1,
      borderColor: COLORS.outlineVariant || '#DDDDDD',
      elevation: 2,
    },
    fabItemText: {
      color: COLORS.onSurfaceVariant || '#333333',
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    paperModalContent: {
      backgroundColor: COLORS.surface || 'white',
      padding: 0,
      marginHorizontal: 20,
      marginVertical: '10%',
      borderRadius: 16,
      alignSelf: 'center',
      maxHeight: '80%',
      width: '90%',
      maxWidth: 400,
      overflow: 'hidden',
      elevation: 10,
    },
    modalHeaderPaper: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: COLORS.primary || '#6200ee',
    },
    modalTitlePaper: {
      color: COLORS.onPrimary || '#ffffff',
      fontWeight: 'bold',
      fontSize: 18,
    },
    modalBodyScrollView: {},
    modalBodyContentContainer: {
      padding: 20,
      flexGrow: 1,
    },
  });

