import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from 'styles/theme';
import { useRouter, usePathname } from 'expo-router';
import TileHeader from './TileHeader';
import TileContent from './TileContent';
import TileTags from './TileTags';
import TileActions from './TileActions';
import ListManager from 'components/listmanager/ListManager';
import ReactionTray from 'components/reactiontray/ReactionTray';
import ShareSheet from 'components/bottomsheet/ShareSheet';
import useQuoteInteractions from 'hooks/useQuoteInteractions';

export default function Tile({ quote, user }) {
  const router = useRouter();
  const listManagerRef = useRef(null);
  const shareSheetRef = useRef(null);

  // Define the navigateToAuthor function
  const navigateToAuthor = (author) => {
    if (author) {
      router.push(`/authors/${encodeURIComponent(author)}`);
    }
  };

  const {
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
  } = useQuoteInteractions({
    quote,
    user,
    shareSheetRef,
    listManagerRef, // Add this parameter
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={handleLongPressTile}
      activeOpacity={0.9} // Almost invisible effect when pressed
      delayLongPress={500} // Shorter delay than default (better UX)
    >
      <TileHeader
        quote={quote}
        onPress={() => navigateToAuthor(quote.author)}
      />

      <TileContent quote={quote} />

      <TileTags
        tags={quote.tags}
        onTagPress={(tag) => router.push(`/tags/${encodeURIComponent(tag)}`)}
      />

      <TileActions
        selectedReaction={selectedReaction}
        reactions={reactions}
        isBookmarked={isBookmarked}
        listCount={listCount}
        onReactionPress={toggleReactionTray}
        onReactionLongPress={toggleReactionTray}
        onBookmarkPress={toggleBookmark}
        onSharePress={() => shareSheetRef.current?.openBottomSheet()}
        handleSelectReaction={handleSelectReaction} // Add this
        toggleReactionTray={toggleReactionTray} // Add this
      />

      {isTrayVisible && (
        <ReactionTray
          animationValue={trayAnim}
          onSelectReaction={handleSelectReaction}
          onClose={toggleReactionTray}
        />
      )}

      <ShareSheet
        ref={shareSheetRef}
        onShareAsText={handleShareAsText}
        onShareAsPhoto={handleShareAsPhoto}
      />

      {user && (
        <ListManager
          ref={listManagerRef}
          user={user}
          quote={quote}
          mode={isBookmarked ? 'remove' : 'add'}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12, // Reduced from 16px to 12px
    backgroundColor: COLORS.surface,
    borderRadius: 8, // Slightly reduced from 10px
    marginTop: 12, // Reduced from 16px
    marginBottom: 2, // Added small bottom margin
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.15, // Slightly increased for more impact
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    borderLeftWidth: 3, // Add an accent border on the left
    borderLeftColor: COLORS.secondary || COLORS.accent1 || '#9C27B0', // Use an accent color
    // Optional: Add a very subtle inner border
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)', // Very subtle white border for depth
  },
});

