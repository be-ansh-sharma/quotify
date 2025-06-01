import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Share } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import TileActions from 'components/quotes/tile/TileActions';
import { router } from 'expo-router';
import ShareSheet from 'components/bottomsheet/ShareSheet';
import ListManager from 'components/listmanager/ListManager';
import useUserStore from 'stores/userStore';
import { showMessage } from 'react-native-flash-message';
import { useAppTheme } from 'context/AppThemeContext';
import {
  removeUserReaction,
  updateQuoteReactions,
} from 'utils/firebase/firestore';

// Define the DEFAULT_REACTIONS constant
const DEFAULT_REACTIONS = {
  mindblown: 0,
  fire: 0,
  love: 0,
  uplifting: 0,
  insight: 0,
  heartEyes: 0,
  sparkles: 0,
};

export default function QuoteFABActions({ quote, refreshQuote = null }) {
  const { COLORS } = useAppTheme();
  const shareSheetRef = useRef(null);
  const listManagerRef = useRef(null);
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [isReactionTrayOpen, setIsReactionTrayOpen] = useState(false);

  // Initialize with null
  const [selectedReaction, setSelectedReaction] = useState(null);

  // Add state for tracking reactions
  const [reactions, setReactions] = useState(
    quote?.reactions || DEFAULT_REACTIONS
  );

  // Add this useEffect to check for existing user reactions
  useEffect(() => {
    // Return early if we don't have a user or quote
    if (!user?.reactions || !quote?.id) {
      setSelectedReaction(null);
      return;
    }

    // Check all reaction types to find if user has already reacted
    for (const [reactionType, quoteIds] of Object.entries(user.reactions)) {
      // If this quote ID is in the array for this reaction type
      if (Array.isArray(quoteIds) && quoteIds.includes(quote.id)) {
        setSelectedReaction(reactionType);
        return;
      }
    }

    // If no reaction found, ensure it's set to null
    setSelectedReaction(null);
  }, [user?.reactions, quote?.id]);

  // CRITICAL FIX: Return early if quote isn't available yet
  if (!quote) {
    return null; // Don't render anything if quote is not available
  }

  // Create a safe quote object with defaults
  const quoteWithDefaults = {
    id: quote.id || 'placeholder',
    text: quote.text || '',
    author: quote.author || '',
    ...quote,
    // Double ensure reactions is never undefined
    reactions: reactions || DEFAULT_REACTIONS,
  };

  // Handlers for ShareSheet
  const handleShareAsText = async () => {
    try {
      await Share.share({
        message: `"${quote.text || ''}"\n\n— ${
          quote.author || 'Unknown'
        }\n\nShared via Quotify`,
      });
      shareSheetRef.current?.closeBottomSheet();
    } catch (error) {
      console.error('Error sharing as text:', error);
    }
  };

  const handleShareAsPhoto = () => {
    shareSheetRef.current?.closeBottomSheet();
    router.push({
      pathname: '/quotes/quoteshare',
      params: {
        quote: quote.text || '',
        author: quote.author || '',
      },
    });
  };

  // Override handlers for TileActions
  const onSharePress = () => {
    if (isReactionTrayOpen) {
      setIsReactionTrayOpen(false);
    }
    shareSheetRef.current?.openBottomSheet();
  };

  const onBookmarkPress = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (isReactionTrayOpen) {
      setIsReactionTrayOpen(false);
    }
    listManagerRef.current?.openBottomSheet();
  };

  // Updated handleSelectReaction with fixes for QuoteFABActions
  const handleSelectReaction = useCallback(
    async (reactionType) => {
      if (!user?.uid) {
        router.push('/login');
        return;
      }

      try {
        // Make a copy of current reactions
        let updatedReactions = { ...reactions };

        if (selectedReaction === reactionType) {
          // Remove reaction (user is toggling off their reaction)
          updatedReactions[reactionType] = Math.max(
            (updatedReactions[reactionType] || 1) - 1,
            0
          );

          if (quote.id && quote.id !== 'placeholder') {
            await removeUserReaction(quote.id, user.uid, reactionType);
          }

          setUser({
            ...user,
            reactions: {
              ...user.reactions,
              [reactionType]: (user.reactions?.[reactionType] || []).filter(
                (id) => id !== quote.id
              ),
            },
          });

          setSelectedReaction(null);
        } else {
          if (selectedReaction) {
            // Remove old reaction
            updatedReactions[selectedReaction] = Math.max(
              (updatedReactions[selectedReaction] || 1) - 1,
              0
            );

            if (quote.id && quote.id !== 'placeholder') {
              await removeUserReaction(quote.id, user.uid, selectedReaction);
            }

            setUser({
              ...user,
              reactions: {
                ...user.reactions,
                [selectedReaction]: (
                  user.reactions?.[selectedReaction] || []
                ).filter((id) => id !== quote.id),
              },
            });
          }

          // Add new reaction
          updatedReactions[reactionType] =
            (updatedReactions[reactionType] || 0) + 1;

          if (quote.id && quote.id !== 'placeholder') {
            await updateQuoteReactions(
              quote.id,
              updatedReactions,
              user.uid,
              reactionType
            );
          }

          setUser({
            ...user,
            reactions: {
              ...user.reactions,
              [reactionType]: [
                ...(user.reactions?.[reactionType] || []),
                quote.id,
              ],
            },
          });

          setSelectedReaction(reactionType);
        }

        // Update reactions state
        setReactions(
          Object.fromEntries(
            Object.entries(updatedReactions).filter(([_, count]) => count > 0)
          )
        );

        // Close tray
        setIsReactionTrayOpen(false);

        // Show feedback
        showMessage({
          message:
            selectedReaction === reactionType
              ? 'Reaction removed'
              : 'Reaction added!',
          type: 'success',
          duration: 2000,
        });
      } catch (error) {
        console.error('Error updating reactions:', error);
        showMessage({
          message: 'Could not update reaction',
          description: 'Please try again later',
          type: 'danger',
        });
      }
    },
    [reactions, selectedReaction, quote.id, user, setUser]
  );

  const toggleReactionTray = () => {
    shareSheetRef.current?.closeBottomSheet();

    if (!user) {
      router.push('/login');
      return;
    }

    setIsReactionTrayOpen(!isReactionTrayOpen);
  };

  const onReactionLongPress = () => {
    if (!user) {
      router.push('/login');
      return;
    }

    showMessage({
      message: 'React to quotes you love!',
      description:
        'Choose your favorite reaction to share how this quote made you feel.',
      type: 'info',
    });
  };

  // Double check we have a valid reactions object for rendering
  const safeReactions = quoteWithDefaults?.reactions || DEFAULT_REACTIONS;

  return (
    <View style={styles.container}>
      {/* Create a wider wrapper for TileActions */}
      <View style={styles.tileActionsWrapper}>
        {/* Custom TileActions wrapper */}
        <View style={styles.customTileActions}>
          <TileActions
            quote={quoteWithDefaults}
            selectedReaction={selectedReaction}
            reactions={reactions}
            isBookmarked={false}
            listCount={0}
            onSharePress={onSharePress}
            onBookmarkPress={onBookmarkPress}
            handleSelectReaction={handleSelectReaction}
            toggleReactionTray={toggleReactionTray}
            onReactionLongPress={onReactionLongPress}
            isReactionTrayOpen={isReactionTrayOpen}
          />
        </View>
      </View>

      {refreshQuote && (
        <TouchableOpacity style={styles.refreshButton} onPress={refreshQuote}>
          <FontAwesome
            name='refresh'
            size={18}
            color={COLORS ? COLORS.primary : '#6200EE'}
          />
          <Text
            style={[
              styles.refreshText,
              { color: COLORS ? COLORS.primary : '#6200EE' },
            ]}
          >
            New Quote
          </Text>
        </TouchableOpacity>
      )}

      <ShareSheet
        ref={shareSheetRef}
        onShareAsText={handleShareAsText}
        onShareAsPhoto={handleShareAsPhoto}
      />

      {user && quote && (
        <ListManager
          ref={listManagerRef}
          user={user}
          quote={quoteWithDefaults}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    //marginTop: 16,
  },
  tileActionsWrapper: {
    position: 'relative',
    zIndex: 9999,
    elevation: 9999,
    // Give more vertical space for reaction tray
    marginVertical: 36,
    width: '100%',
    // Ensure proper padding around the component
    paddingHorizontal: 0,
  },
  // New: Custom wrapper to control TileActions presentation
  customTileActions: {
    width: '100%',
    justifyContent: 'space-between',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#6200EE',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
    zIndex: 1,
  },
  refreshText: {
    fontWeight: '500',
  },
});

