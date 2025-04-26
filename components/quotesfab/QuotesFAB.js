import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from 'styles/theme';
import QuoteOfTheDay from './QuoteOfTheDay';
import TopQuote from './TopQuote';
import RandomQuote from './RandomQuote';

export default function QuotesFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeQuote, setActiveQuote] = useState(null);
  const animation = useRef(new Animated.Value(0)).current;

  // Close menu when clicking outside
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (isOpen) setIsOpen(false);
      }, 8000); // Auto close after 8 seconds if no interaction

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    Animated.spring(animation, {
      toValue,
      friction: 6,
      useNativeDriver: true,
    }).start();

    setIsOpen(!isOpen);
  };

  const openQuoteModal = (quoteType) => {
    setActiveQuote(quoteType);
    setShowModal(true);
    setIsOpen(false);
  };

  // Add this function to properly close both the modal and animate the FAB menu closed
  const closeEverything = () => {
    // Close modal first
    setShowModal(false);

    // Then animate the FAB menu closed
    Animated.spring(animation, {
      toValue: 0,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Update the isOpen state
    setIsOpen(false);
  };

  // Calculate rotations and translations
  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // Daily quote animation
  const dailyQuoteTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });

  // Top quote animation
  const topQuoteTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  });

  // Random quote animation
  const randomQuoteTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  const renderContent = () => {
    switch (activeQuote) {
      case 'daily':
        return <QuoteOfTheDay />;
      case 'top':
        return <TopQuote />;
      case 'random':
        return <RandomQuote />;
      default:
        return <QuoteOfTheDay />;
    }
  };

  return (
    <>
      {/* Backdrop for closing the menu when tapped outside */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={0}
          onPress={() => setIsOpen(false)}
        />
      )}

      {/* Expandable FAB Menu */}
      <View style={styles.fabContainer}>
        {/* Random Quote Button */}
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
            <Text style={styles.fabItemText}>Random Quote</Text>
          </View>
          <TouchableOpacity
            style={[styles.fabItemButton, { backgroundColor: '#9C27B0' }]}
            onPress={() => openQuoteModal('random')}
          >
            <FontAwesome name='random' size={18} color='#fff' />
          </TouchableOpacity>
        </Animated.View>

        {/* Top Quote Button */}
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
            <Text style={styles.fabItemText}>Top Quote</Text>
          </View>
          <TouchableOpacity
            style={[styles.fabItemButton, { backgroundColor: '#FF9800' }]}
            onPress={() => openQuoteModal('top')}
          >
            <FontAwesome name='trophy' size={18} color='#fff' />
          </TouchableOpacity>
        </Animated.View>

        {/* Daily Quote Button */}
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
            <Text style={styles.fabItemText}>Quote of the Day</Text>
          </View>
          <TouchableOpacity
            style={[styles.fabItemButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => openQuoteModal('daily')}
          >
            <FontAwesome name='calendar' size={18} color='#fff' />
          </TouchableOpacity>
        </Animated.View>

        {/* Main FAB */}
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <TouchableOpacity
            style={styles.fab}
            onPress={toggleMenu}
            activeOpacity={0.8}
          >
            <FontAwesome name='quote-left' size={24} color='#fff' />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Modal for selected quote */}
      <Modal
        visible={showModal}
        animationType='fade'
        transparent
        onRequestClose={closeEverything}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeQuote === 'daily'
                  ? 'Quote of the Day'
                  : activeQuote === 'top'
                  ? 'Top Quote'
                  : 'Random Quote'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeEverything}
              >
                <FontAwesome name='close' size={20} color='#fff' />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.quoteContainer}
              contentContainerStyle={styles.quoteContentContainer}
            >
              {renderContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
    alignSelf: 'flex-end', // Align to the right
  },
  fabItem: {
    position: 'absolute',
    flexDirection: 'row', // Arrange children horizontally
    alignItems: 'center',
    right: 4, // Small offset from right
    justifyContent: 'flex-end', // Align children to the right
    width: 200, // Fixed width to contain both label and button
  },
  fabItemButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabItemLabel: {
    // Remove marginTop, add marginRight
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  fabItemText: {
    color: '#fff',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  quoteContainer: {
    maxHeight: 400,
  },
  quoteContentContainer: {
    padding: 8,
  },
  // Tab styles
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.placeholder,
    fontSize: 14,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  // Placeholder styles
  placeholderContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    margin: 8,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: COLORS.placeholder,
    fontStyle: 'italic',
  },
});

