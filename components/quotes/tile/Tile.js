import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from 'styles/theme'; // Import COLORS
import { router } from 'expo-router';
import {
  likeQuote,
  unlikeQuote,
  bookmarkQuote,
  unbookmarkQuote,
} from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';

export default function Tile({ quote, user }) {
  const [isLiked, setIsLiked] = useState(false); // State to track like status
  const [isBookmarked, setIsBookmarked] = useState(false); // State to track bookmark status
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isGuest = useUserStore((state) => state.isGuest); // Check if the user is a guest
  const setUser = useUserStore((state) => state.setUser); // Function to update the user in the store

  // Check if the quote is already liked or bookmarked by the user
  useEffect(() => {
    if (!isGuest) {
      if (user?.likes?.includes(quote.id)) {
        setIsLiked(true); // Set the initial liked state
      }
      if (user?.bookmarked?.includes(quote.id)) {
        setIsBookmarked(true); // Set the initial bookmarked state
      }
    }
  }, [user, quote.id]);

  const toggleLike = async () => {
    if (isGuest) {
      SnackbarService.show('Please log in to like quotes');
      return;
    }
    // Trigger the "pop-out" animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.5, // Scale up
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1, // Scale back to normal
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Toggle the like state
    setIsLiked((prev) => !prev);

    // Call Firestore functions to update likes and update the user in the store
    try {
      if (!isLiked) {
        await likeQuote(user.uid, quote.id);
        setUser({
          ...user,
          likes: [...user.likes, quote.id], // Add the quote ID to the user's likes
        });
      } else {
        await unlikeQuote(user.uid, quote.id);
        setUser({
          ...user,
          likes: user.likes.filter((id) => id !== quote.id), // Remove the quote ID from the user's likes
        });
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const toggleBookmark = async () => {
    if (isGuest) {
      SnackbarService.show('Please log in to bookmark quotes');
      return;
    }
    // Toggle the bookmark state
    setIsBookmarked((prev) => !prev);

    // Call Firestore functions to update bookmarks and update the user in the store
    try {
      if (!isBookmarked) {
        await bookmarkQuote(user.uid, quote.id); // Add the quote to the user's bookmarks
        setUser({
          ...user,
          bookmarked: [...user.bookmarked, quote.id], // Add the quote ID to the user's bookmarks
        });
      } else {
        await unbookmarkQuote(user.uid, quote.id); // Remove the quote from the user's bookmarks
        setUser({
          ...user,
          bookmarked: user.bookmarked.filter((id) => id !== quote.id), // Remove the quote ID from the user's bookmarks
        });
      }
    } catch (error) {
      console.error('Error updating bookmarks:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    const initials = nameParts.map((part) => part[0]).join('');
    return initials.toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* Author Avatar and Name */}
      <TouchableOpacity
        style={styles.header}
        onPress={() =>
          router.push(`/author/${encodeURIComponent(quote.author)}`)
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(quote.author)}</Text>
        </View>
        <Text style={styles.author}>{quote.author}</Text>
      </TouchableOpacity>

      {/* Quote Text */}
      <Text style={styles.text}>{quote.text}</Text>

      {/* Tags */}
      <View style={styles.tags}>
        {quote.tags.map((tag, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => router.push(`/tag/${encodeURIComponent(tag)}`)}
          >
            <Text style={styles.tag}>#{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action Icons */}
      <View style={styles.actions}>
        {/* Heart Icon */}
        <TouchableOpacity style={styles.actionButton} onPress={toggleLike}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <FontAwesome
              name={isLiked ? 'heart' : 'heart-o'} // Filled heart if liked
              size={24}
              color={isLiked ? COLORS.liked : COLORS.icon} // Highlighted color if liked
            />
          </Animated.View>
          {quote.likes > 100 && (
            <Text style={styles.actionText}>{quote.likes}</Text>
          )}
        </TouchableOpacity>

        {/* Bookmark Icon */}
        <TouchableOpacity style={styles.actionButton} onPress={toggleBookmark}>
          <FontAwesome
            name={isBookmarked ? 'bookmark' : 'bookmark-o'} // Filled bookmark if bookmarked
            size={20}
            color={isBookmarked ? COLORS.primary : COLORS.icon} // Highlighted color if bookmarked
          />
        </TouchableOpacity>

        {/* Share Icon */}
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome name='share' size={20} color={COLORS.icon} />
          {quote.shares > 100 && (
            <Text style={styles.actionText}>{quote.shares}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginBottom: 16,
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
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.text,
  },
});

