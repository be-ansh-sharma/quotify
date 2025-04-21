import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Share,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from 'styles/theme';
import { useRouter, usePathname } from 'expo-router';
import ListManager from 'components/listmanager/ListManager';
import {
  likeQuote,
  removeUserReaction,
  unlikeQuote,
  updateQuoteReactions,
} from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import ReactionTray from 'components/reactiontray/ReactionTray';
import { Audio } from 'expo-av';

export default function Tile({ quote, user }) {
  const [isLiked, setIsLiked] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const trayAnim = useRef(new Animated.Value(0)).current;
  const isGuest = useUserStore((state) => state.isGuest);
  const setUser = useUserStore((state) => state.setUser);
  const bookmarklist = user?.bookmarklist || {};
  const router = useRouter();
  const currentPath = usePathname();
  const listManagerRef = useRef(null);
  const [isTrayVisible, setIsTrayVisible] = useState(false);
  const [reactions, setReactions] = useState(quote.reactions || {});
  const [selectedReaction, setSelectedReaction] = useState(
    Object.keys(user?.reactions || {}).find((reactionType) =>
      user.reactions[reactionType]?.includes(quote.id)
    ) || null
  );
  const isTrayVisibleRef = useRef(false);

  useEffect(() => {
    if (
      !isGuest &&
      Array.isArray(user?.likes) &&
      user.likes.includes(quote.id)
    ) {
      setIsLiked(true);
    }
  }, [user, quote.id]);

  const isBookmarked = useMemo(() => {
    return Object.values(bookmarklist).some((list) => list.includes(quote.id));
  }, [bookmarklist, quote.id]);

  const listCount = useMemo(() => {
    return Object.values(bookmarklist).filter((list) => list.includes(quote.id))
      .length;
  }, [bookmarklist, quote.id]);

  const toggleLike = async () => {
    if (isGuest) {
      SnackbarService.show('Please log in to like quotes');
      return;
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setIsLiked((prev) => !prev);

    try {
      if (!isLiked) {
        await likeQuote(user.uid, quote.id);
        setUser({ ...user, likes: [...(user.likes || []), quote.id] });
      } else {
        await unlikeQuote(user.uid, quote.id);
        setUser({
          ...user,
          likes: (user.likes || []).filter((id) => id !== quote.id),
        });
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const toggleBookmark = () => {
    if (isGuest) {
      SnackbarService.show('Please log in to manage bookmarks');
      return;
    }

    listManagerRef.current?.openBottomSheet();
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  const navigateToAuthor = (author) => {
    const targetPath = `/authors/${encodeURIComponent(author)}`;
    currentPath === targetPath
      ? router.replace(targetPath)
      : router.push(targetPath);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${quote.text}" - ${
          quote.author || 'Unknown'
        }\n\nShared via Quotify App`,
      });
    } catch (error) {
      console.error('Error sharing quote:', error);
    }
  };

  const toggleReactionTray = () => {
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
  };

  const handleSelectReaction = async (reactionType) => {
    if (isGuest) {
      SnackbarService.show('Please log in to react to quotes');
      return;
    }

    try {
      let updatedReactions = { ...reactions };

      if (selectedReaction === reactionType) {
        // Remove the existing reaction
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
        // Play the sound only when adding a new reaction
        const { sound } = await Audio.Sound.createAsync(
          require('assets/sounds/reaction-select.mp3') // Path to your sound file
        );
        await sound.playAsync();

        if (selectedReaction) {
          // Remove the old reaction
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

        // Add the new reaction
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

      // Update the reactions state
      setReactions(
        Object.fromEntries(
          Object.entries(updatedReactions).filter(([_, count]) => count > 0)
        )
      );

      // Close the tray after selecting a reaction
      isTrayVisibleRef.current = false;
      setIsTrayVisible(false);
    } catch (error) {
      console.error('Error updating reactions:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => navigateToAuthor(quote.author)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(quote.author)}</Text>
        </View>
        <Text style={styles.author}>{quote.author}</Text>
      </TouchableOpacity>

      {/* Quote */}
      <Text style={styles.text}>{quote.text}</Text>

      {/* Tags */}
      <View style={styles.tags}>
        {quote.tags.map((tag, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(`/tags/${encodeURIComponent(tag)}`)}
          >
            <Text style={styles.tag}>#{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (selectedReaction) {
                // If a reaction is already selected, remove it
                handleSelectReaction(selectedReaction);
              } else if (!isTrayVisibleRef.current) {
                // If no reaction is selected and the tray is not already visible, open the tray
                toggleReactionTray();
              }
            }}
            onLongPress={() => {
              // Open the reaction tray on long press
              if (!isTrayVisibleRef.current) {
                toggleReactionTray();
              }
            }}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Text style={styles.reactionIcon}>
                {selectedReaction === 'mindblown' && '🤯'}
                {selectedReaction === 'fire' && '🔥'}
                {selectedReaction === 'love' && '❤️'}
                {selectedReaction === 'funny' && '😂'}
                {selectedReaction === 'heartEyes' && '😍'}
                {!selectedReaction && (
                  <FontAwesome name='heart-o' size={24} color={COLORS.icon} />
                )}
              </Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Bookmark */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={toggleBookmark}
          >
            <View>
              <FontAwesome
                name={isBookmarked ? 'bookmark' : 'bookmark-o'}
                size={20}
                color={isBookmarked ? COLORS.primary : COLORS.icon}
              />
              {listCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{listCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <FontAwesome name='share-alt' size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Reaction Counts */}
        <View style={styles.rightActions}>
          {Object.entries(reactions)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => (
              <Text key={type} style={styles.reactionCount}>
                {type === 'mindblown' && '🤯'}
                {type === 'fire' && '🔥'}
                {type === 'love' && '❤️'}
                {type === 'funny' && '😂'}
                {type === 'heartEyes' && '😍'} {count}
              </Text>
            ))}
        </View>
      </View>

      {/* Reaction Tray with Animation */}
      {isTrayVisible && (
        <ReactionTray
          animationValue={trayAnim}
          onSelectReaction={handleSelectReaction}
          onClose={toggleReactionTray}
        />
      )}

      {/* List Manager */}
      {user && (
        <ListManager
          ref={listManagerRef}
          user={user}
          quote={quote}
          mode={isBookmarked ? 'remove' : 'add'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginTop: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.avatarText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  author: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  text: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    fontSize: 12,
    color: COLORS.tag,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  reactionIcon: {
    fontSize: 20,
    color: COLORS.icon,
  },
  reactionCount: {
    fontSize: 14,
    color: COLORS.text,
    marginRight: 8,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  shareButton: {
    marginRight: 16,
  },
});

