import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from 'styles/theme'; // Import COLORS
import { useRouter, usePathname } from 'expo-router';
import ListManager from 'components/listmanager/ListManager'; // Import the new ListManager component
import { likeQuote, unlikeQuote } from 'utils/firebase/firestore';
import useUserStore from 'stores/userStore';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';

export default function Tile({ quote, user }) {
  const [isLiked, setIsLiked] = useState(false); // State to track like status
  const bottomSheetRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isGuest = useUserStore((state) => state.isGuest); // Check if the user is a guest
  const setUser = useUserStore((state) => state.setUser); // Function to update the user in the store
  const bookmarklist = user?.bookmarklist || {}; // Access the user's bookmarklist from the user object
  const router = useRouter();
  const currentPath = usePathname(); // Get the current route path
  const listManagerRef = useRef(null); // Ref for the ListManager component

  // Check if the quote is already liked or bookmarked by the user
  useEffect(() => {
    if (!isGuest) {
      if (Array.isArray(user?.likes) && user.likes.includes(quote.id)) {
        setIsLiked(true); // Set the initial liked state
      }
    }
  }, [user, quote.id]);

  // Check if the quote is part of any user-created list
  const isBookmarked = useMemo(() => {
    return Object.values(bookmarklist).some((list) =>
      list.some((q) => q.id === quote.id)
    );
  }, [bookmarklist, quote.id]);

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
          likes: [...(user.likes || []), quote.id], // Ensure `user.likes` is an array
        });
      } else {
        await unlikeQuote(user.uid, quote.id);
        setUser({
          ...user,
          likes: (user.likes || []).filter((id) => id !== quote.id), // Ensure `user.likes` is an array
        });
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const toggleBookmark = () => {
    if (isGuest) {
      SnackbarService.show('Please log in to bookmark quotes');
      return;
    }

    if (listManagerRef.current) {
      listManagerRef.current.openBottomSheet(isBookmarked); // Pass `isBookmarked` to determine the mode
    } else {
      console.log('listManagerRef.current is null');
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    const initials = nameParts.map((part) => part[0]).join('');
    return initials.toUpperCase();
  };

  const navigateToAuthor = (author) => {
    const targetPath = `/authors/${encodeURIComponent(author)}`;
    if (currentPath === targetPath) {
      // If already on the target author screen, replace the route
      router.replace(targetPath);
    } else {
      // Otherwise, push a new route
      router.push(targetPath);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `"${quote.text}" - ${
          quote.author || 'Unknown'
        }\n\nShared via Quotify App`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Quote shared successfully!');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing quote:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Author Avatar and Name */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => navigateToAuthor(quote.author)}
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
            onPress={() => router.push(`/tags/${encodeURIComponent(tag)}`)}
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={toggleBookmark}
          activeOpacity={0.7} // Make it more responsive
        >
          <FontAwesome
            name={isBookmarked ? 'bookmark' : 'bookmark-o'} // Filled bookmark if bookmarked
            size={20}
            color={isBookmarked ? COLORS.primary : COLORS.icon} // Highlighted color if bookmarked
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <FontAwesome name='share-alt' size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* List Manager */}
      {user && <ListManager ref={listManagerRef} user={user} quote={quote} />}
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
  bottomSheetContent: {
    padding: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listItemText: {
    fontSize: 16,
  },
});

