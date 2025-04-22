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
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginTop: 16,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
});

