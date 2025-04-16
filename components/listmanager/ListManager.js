import React, {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Portal } from 'react-native-paper';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { TextInput, Button } from 'react-native-paper';
import { COLORS } from 'styles/theme';
import { addQuoteToList, fetchUserLists } from 'utils/firebase/firestore';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import useUserStore from 'stores/userStore';

const MAX_LISTS = 10; // Define the maximum number of lists a user can create

const ListManager = React.forwardRef(({ user, quote }, ref) => {
  const bottomSheetRef = useRef(null);
  const [listName, setListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showInput, setShowInput] = useState(false); // Track whether to show the input box
  const bookmarklist = user.bookmarklist || {};
  const setUser = useUserStore((state) => state.setUser); // Function to update the user in the store

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openBottomSheet: () => {
      setIsVisible(true);

      setTimeout(() => {
        if (bottomSheetRef.current) {
          bottomSheetRef.current.snapToIndex(0);
        } else {
          console.error('Bottom sheet ref is not available');
        }
      }, 100);
    },
  }));

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    []
  );

  const handleCreateList = async () => {
    if (!listName.trim()) {
      SnackbarService.show('List name cannot be empty');
      return;
    }

    if (Object.keys(bookmarklist).length >= MAX_LISTS) {
      SnackbarService.show(`You can only create up to ${MAX_LISTS} lists.`);
      return;
    }

    setLoading(true);
    try {
      // Add the quote to the new list in Firestore
      await addQuoteToList(user.uid, listName, quote.id);

      const updatedBookmarklist = {
        ...(state.user.bookmarklist || {}), // Ensure bookmarklist is an object
        [listName]: [...(state.user.bookmarklist?.[listName] || []), quote.id], // Add the quote ID to the list
      };
      // Update the user object in the Zustand store
      setUser({
        ...user,
        bookmarklist: updatedBookmarklist,
      });

      SnackbarService.show(`Quote added to "${listName}"`);
      setListName('');
      setShowInput(false); // Hide the input box after creating the list
      bottomSheetRef.current?.close();
      setIsVisible(false);
    } catch (error) {
      console.error('Error creating list:', error);
      SnackbarService.show('Failed to add quote to list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToExistingList = async (listName) => {
    setLoading(true);
    try {
      await addQuoteToList(user.uid, listName, quote.id);

      const updatedBookmarklist = {
        ...(state.user.bookmarklist || {}),
        [listName]: [...(state.user.bookmarklist?.[listName] || []), quote.id],
      };
      // Update the user object in the Zustand store
      setUser({
        ...user,
        bookmarklist: updatedBookmarklist,
      });

      SnackbarService.show(`Quote added to "${listName}"`);
      bottomSheetRef.current?.close();
      setIsVisible(false);
    } catch (error) {
      console.error('Error adding quote to list:', error);
      SnackbarService.show('Failed to add quote to list');
    } finally {
      setLoading(false);
    }
  };

  const handleNewListClick = () => {
    if (Object.keys(bookmarklist).length >= MAX_LISTS) {
      SnackbarService.show(`You can only create up to ${MAX_LISTS} lists.`);
      return;
    }
    setShowInput(true); // Show the input box when the user clicks "+ New List"
  };

  const handleCancelNewList = () => {
    setShowInput(false); // Hide the input box when the user cancels
    setListName(''); // Clear the input field
  };

  const handleSheetChanges = useCallback((index) => {
    console.log('Sheet index changed:', index);
    if (index === -1) {
      setIsVisible(false);
    }
  }, []);

  return (
    <Portal>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['60%']}
        index={-1}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.indicator}
        enableOverDrag={true}
        style={styles.bottomSheet}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Save Quote to List</Text>

          {/* New List Button or Input */}
          {showInput ? (
            <View>
              <TextInput
                label='New List Name'
                value={listName}
                onChangeText={setListName}
                style={styles.input}
                theme={{ colors: { primary: COLORS.primary } }}
              />
              <View style={styles.newListActions}>
                <Button
                  mode='contained'
                  onPress={handleCreateList}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                  color={COLORS.primary}
                >
                  Save
                </Button>
                <Button
                  mode='text'
                  onPress={handleCancelNewList}
                  style={styles.cancelButton}
                  color={COLORS.placeholder}
                >
                  Cancel
                </Button>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleNewListClick}
              style={styles.newListButton}
            >
              <Text style={styles.newListButtonText}>+ New List</Text>
            </TouchableOpacity>
          )}

          {/* Existing Lists */}
          <Text style={styles.existingListsTitle}>Your Lists</Text>
          {Object.keys(bookmarklist).length > 0 ? (
            Object.entries(bookmarklist).map(([name, quotes], index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleAddToExistingList(name)}
                style={styles.listItem}
              >
                <Text style={styles.listItemText}>
                  {name} ({quotes.length}) {/* Display the count */}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noListsText}>
              You haven't created any lists yet. Create your first list above.
            </Text>
          )}
        </BottomSheetView>
      </BottomSheet>
    </Portal>
  );
});

const styles = StyleSheet.create({
  bottomSheet: {
    zIndex: 1000,
  },
  bottomSheetBackground: {
    backgroundColor: COLORS.surface,
  },
  indicator: {
    backgroundColor: COLORS.placeholder,
    width: 40,
  },
  bottomSheetContent: {
    padding: 16,
    flex: 1,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  newListActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
  },
  newListButton: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  newListButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  existingListsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.text,
  },
  listItem: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 10,
  },
  listItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  noListsText: {
    fontSize: 14,
    color: COLORS.placeholder,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
    paddingVertical: 16,
  },
});

export default ListManager;

