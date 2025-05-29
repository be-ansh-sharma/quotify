import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Animated, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  removeUserReaction,
  updateQuoteReactions,
  updateShareCount,
} from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { showMessage } from 'react-native-flash-message';

export default function useQuoteInteractions({
  quote,
  user,
  shareSheetRef,
  listManagerRef,
}) {
  const [selectedReaction, setSelectedReaction] = useState(
    Object.keys(user?.reactions || {}).find((reactionType) =>
      user?.reactions[reactionType]?.includes(quote.id)
    ) || null
  );

  const [reactions, setReactions] = useState(quote.reactions || {});
  const [isTrayVisible, setIsTrayVisible] = useState(false);
  const trayAnim = useRef(new Animated.Value(0)).current;
  const isTrayVisibleRef = useRef(false);

  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  const bookmarklist = user?.bookmarklist || {};

  // This handles nested structures like "us@yopmail": {"com": []}
  const isBookmarked = useMemo(() => {
    if (!bookmarklist || typeof bookmarklist !== 'object') return false;

    // Check direct arrays
    const directArrays = Object.values(bookmarklist).filter(Array.isArray);
    if (directArrays.some((list) => list.includes(quote.id))) return true;

    // Check nested objects that might contain arrays
    const nestedObjects = Object.values(bookmarklist).filter(
      (val) => typeof val === 'object' && val !== null && !Array.isArray(val)
    );

    for (const obj of nestedObjects) {
      if (
        Object.values(obj).some(
          (list) => Array.isArray(list) && list.includes(quote.id)
        )
      ) {
        return true;
      }
    }

    return false;
  }, [bookmarklist, quote.id]);

  // Complete the isBookmarked function:
  const listCount = useMemo(() => {
    if (!bookmarklist || typeof bookmarklist !== 'object') return 0;

    let count = 0;

    // Count direct arrays containing the quote
    Object.values(bookmarklist).forEach((list) => {
      if (Array.isArray(list) && list.includes(quote.id)) {
        count++;
      }
    });

    // Count in nested objects
    Object.values(bookmarklist).forEach((val) => {
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        Object.values(val).forEach((nestedList) => {
          if (Array.isArray(nestedList) && nestedList.includes(quote.id)) {
            count++;
          }
        });
      }
    });

    return count;
  }, [bookmarklist, quote.id]);

  const toggleReactionTray = useCallback(() => {
    if (!isTrayVisibleRef.current) {
      isTrayVisibleRef.current = true;
      setIsTrayVisible(true);
      Animated.timing(trayAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(trayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        isTrayVisibleRef.current = false;
        setIsTrayVisible(false);
      });
    }
  }, [trayAnim]);

  const handleSelectReaction = useCallback(
    async (reactionType) => {
      if (!user?.uid) {
        showMessage({
          message: 'Please log in to react to quotes',
          type: 'warning',
        });
        return;
      }

      try {
        let updatedReactions = { ...reactions };

        if (selectedReaction === reactionType) {
          // Remove reaction
          updatedReactions[reactionType] = Math.max(
            (updatedReactions[reactionType] || 1) - 1,
            0
          );
          await removeUserReaction(quote.id, user.uid, reactionType);
          setUser({
            ...user,
            reactions: {
              ...user.reactions,
              [reactionType]: user.reactions[reactionType]?.filter(
                (id) => id !== quote.id
              ),
            },
          });
          setSelectedReaction(null);
        } else {
          // Add new reaction
          const { sound } = await Audio.Sound.createAsync(
            require('assets/sounds/reaction-select.mp3')
          );
          await sound.playAsync();

          if (selectedReaction) {
            // Remove old reaction
            updatedReactions[selectedReaction] = Math.max(
              (updatedReactions[selectedReaction] || 1) - 1,
              0
            );
            await removeUserReaction(quote.id, user.uid, selectedReaction);
            setUser({
              ...user,
              reactions: {
                ...user.reactions,
                [selectedReaction]: user.reactions[selectedReaction]?.filter(
                  (id) => id !== quote.id
                ),
              },
            });
          }

          // Add new reaction
          updatedReactions[reactionType] =
            (updatedReactions[reactionType] || 0) + 1;

          await updateQuoteReactions(
            quote.id,
            updatedReactions,
            user.uid,
            reactionType
          );

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
        isTrayVisibleRef.current = false;
        setIsTrayVisible(false);
      } catch (error) {
        console.error('Error updating reactions:', error);
      }
    },
    [reactions, selectedReaction, quote.id, user, setUser]
  );

  const toggleBookmark = useCallback(() => {
    if (!user?.uid) {
      showMessage({
        message: 'Please log in to manage bookmarks',
        type: 'warning',
      });
      return;
    }
    // Open list manager
    if (listManagerRef.current) {
      listManagerRef.current.openBottomSheet();
    }
  }, [user, listManagerRef]);

  const handleLongPressTile = useCallback(() => {
    if (__DEV__) {
      console.log('quote ID', quote.id);
    }
    Clipboard.setString(`"${quote.text}" - ${quote.author || 'Unknown'}`);
    showMessage({
      message: 'Quote copied to clipboard!',
      type: 'success',
    });
  }, [quote]);

  const handleShareAsText = useCallback(async () => {
    try {
      await Share.share({
        message: `"${quote.text}" - ${
          quote.author || 'Unknown'
        }\n\nShared via Quotify App`,
      });
      await updateShareCount(quote.id);

      shareSheetRef.current?.closeBottomSheet();
    } catch (error) {
      console.error('Error sharing quote as text:', error);
    }
  }, [quote, shareSheetRef]);

  const handleShareAsPhoto = useCallback(() => {
    shareSheetRef.current?.closeBottomSheet();
    router.push({
      pathname: '/quotes/quoteshare',
      params: { quote: quote.text, author: quote.author, id: quote.id },
    });
  }, [quote, router, shareSheetRef]);

  return {
    isBookmarked,
    listCount,
    reactions,
    selectedReaction,
    isTrayVisible,
    trayAnim,
    handleSelectReaction,
    toggleReactionTray,
    toggleBookmark,
    handleLongPressTile,
    handleShareAsText,
    handleShareAsPhoto,
  };
}

