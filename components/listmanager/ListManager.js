import React, {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Portal, Button, TextInput } from 'react-native-paper';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { COLORS } from 'styles/theme';
import { addQuoteToList, removeQuoteFromList } from 'utils/firebase/firestore';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import useUserStore from 'stores/userStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Import icons

const MAX_LISTS = 10; // Define the maximum number of lists a user can create

const ListManager = React.forwardRef(({ user, quote }, ref) => {
  const bottomSheetRef = useRef(null);
  const [listName, setListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showInput, setShowInput] = useState(false); // Track whether to show the input box
  const [tempSelection, setTempSelection] = useState({}); // Temporary selection of lists
  const bookmarklist = user.bookmarklist || {};
  const setUser = useUserStore((state) => state.setUser); // Function to update the user in the store

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openBottomSheet: () => {
      setTempSelection(
        Object.keys(bookmarklist).reduce((acc, listName) => {
          acc[listName] = bookmarklist[listName]?.includes(quote.id) || false;
          return acc;
        }, {})
      );
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

  const toggleListSelection = (listName) => {
    setTempSelection((prev) => ({
      ...prev,
      [listName]: !prev[listName],
    }));
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const updatedBookmarklist = { ...bookmarklist };

      for (const [listName, isSelected] of Object.entries(tempSelection)) {
        const isQuoteInList = bookmarklist[listName]?.includes(quote.id);

        if (isSelected && !isQuoteInList) {
          // Add the quote to the list
          await addQuoteToList(user.uid, listName, quote.id);
          updatedBookmarklist[listName] = [
            ...(updatedBookmarklist[listName] || []),
            quote.id,
          ];
        } else if (!isSelected && isQuoteInList) {
          // Remove the quote from the list
          await removeQuoteFromList(user.uid, listName, quote.id);
          updatedBookmarklist[listName] = updatedBookmarklist[listName].filter(
            (id) => id !== quote.id
          );
        }
      }

      // Update the user object in the Zustand store
      setUser({
        ...user,
        bookmarklist: updatedBookmarklist,
      });

      SnackbarService.show('Changes saved successfully.');
      bottomSheetRef.current?.close();
      setIsVisible(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      SnackbarService.show('Failed to save changes.');
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
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.7}
          />
        )}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.indicator}
        enableOverDrag={true}
        style={styles.bottomSheet}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Manage Your Lists</Text>

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
                  onPress={handleSaveChanges}
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
            Object.keys(bookmarklist).map((name, index) => (
              <View key={index} style={styles.listContainer}>
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => toggleListSelection(name)}
                >
                  <Icon
                    name={
                      tempSelection[name]
                        ? 'checkbox-marked-circle'
                        : 'checkbox-blank-circle-outline'
                    }
                    size={24}
                    color={tempSelection[name] ? COLORS.primary : COLORS.text}
                  />
                  <Text style={styles.listTitle}>{name}</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noListsText}>
              You haven't created any lists yet. Create your first list above.
            </Text>
          )}

          {/* Save Button */}
          <Button
            mode='contained'
            onPress={handleSaveChanges}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
            color={COLORS.primary}
          >
            Save Changes
          </Button>
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
  listContainer: {
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  listTitle: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 8,
  },
  noListsText: {
    fontSize: 14,
    color: COLORS.placeholder,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
    paddingVertical: 16,
  },
  saveButton: {
    marginTop: 16,
  },
});

export default ListManager;

