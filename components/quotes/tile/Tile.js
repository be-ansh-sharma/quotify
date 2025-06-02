import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
// Change this import
import { useAppTheme } from 'context/AppThemeContext';
import { useRouter } from 'expo-router';
import TileHeader from './TileHeader';
import TileContent from './TileContent';
import TileTags from './TileTags';
import TileActions from './TileActions';
import ListManager from 'components/listmanager/ListManager';
import ReactionTray from 'components/reactiontray/ReactionTray';
import ShareSheet from 'components/bottomsheet/ShareSheet';
import useQuoteInteractions from 'hooks/useQuoteInteractions';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function Tile({ quote, user }) {
  const router = useRouter();
  const listManagerRef = useRef(null);
  const shareSheetRef = useRef(null);

  // Get COLORS from theme context
  const { COLORS } = useAppTheme();

  // Generate styles with current COLORS
  const styles = getStyles(COLORS);

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

  // Add isPending check to hide actions
  const shouldHideActions = quote?.isPending || quote?.visibility === 'private';

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

      {/* Action buttons - only show if not pending */}
      {!shouldHideActions && (
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
      )}

      {/* Show pending status instead of actions if pending */}
      {shouldHideActions && quote?.isPending && (
        <View style={styles.pendingActionsContainer}>
          <MaterialIcons name='schedule' size={16} color={COLORS.text} />
          <Text style={styles.pendingActionsText}>
            Actions will be available after approval
          </Text>
        </View>
      )}

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

// Convert static styles to a function that takes COLORS
const getStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      padding: 12, // Reduced from 16px to 12px
      backgroundColor: COLORS.surface,
      borderRadius: 8, // Slightly reduced from 10px
      marginTop: 12, // Reduced from 16px
      marginBottom: 2, // Added small bottom margin
      shadowColor: COLORS.shadow,
      shadowOpacity: 0.15, // Slightly increased for more impact
      shadowRadius: 4,
      elevation: 2, // For Android shadow
      shadowOffset: { width: 0, height: 1 },
      borderLeftWidth: 3, // Add an accent border on the left
      borderLeftColor: COLORS.secondary || COLORS.accent1 || '#9C27B0', // Use an accent color
      borderWidth: 0.5,
      borderColor: 'rgba(255,255,255,0.05)', // Very subtle white border for depth
    },
    pendingActionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: `${COLORS.warning}10`,
      borderTopWidth: 1,
      borderTopColor: `${COLORS.warning}20`,
    },
    pendingActionsText: {
      marginLeft: 8,
      fontSize: 12,
      color: COLORS.text,
      fontStyle: 'italic',
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: `${COLORS.disabled}20`,
      backgroundColor: COLORS.surface,
    },
  });

