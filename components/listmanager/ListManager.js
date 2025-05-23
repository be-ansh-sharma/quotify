import React, {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Portal, Button, TextInput } from 'react-native-paper';
import BottomSheet from '../shared/BottomSheet'; // Use our custom BottomSheet
import { addQuoteToList, removeQuoteFromList } from 'utils/firebase/firestore';
import { SnackbarService } from 'utils/services/snackbar/SnackbarService';
import useUserStore from 'stores/userStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from 'context/AppThemeContext'; // Import theme context
import { router } from 'expo-router';

const FREE_MAX_LISTS = 5;
const PREMIUM_MAX_LISTS = 20;

const ListManager = React.forwardRef(({ user, quote }, ref) => {
  const bottomSheetRef = useRef(null);
  const [listName, setListName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [tempSelection, setTempSelection] = useState({});
  const bookmarklist = user.bookmarklist || {};
  const setUser = useUserStore((state) => state.setUser);

  const { COLORS } = useAppTheme(); // Get theme colors

  const isPro = !!user?.isPro;
  const MAX_LISTS = isPro ? PREMIUM_MAX_LISTS : FREE_MAX_LISTS;

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openBottomSheet: () => {
      setTempSelection(
        Object.keys(bookmarklist).reduce((acc, listName) => {
          acc[listName] = bookmarklist[listName]?.includes(quote.id) || false;
          return acc;
        }, {})
      );

      bottomSheetRef.current?.expand(); // Use our custom method
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
          await addQuoteToList(user.uid, listName, quote.id);
          updatedBookmarklist[listName] = [
            ...(updatedBookmarklist[listName] || []),
            quote.id,
          ];
        } else if (!isSelected && isQuoteInList) {
          await removeQuoteFromList(user.uid, listName, quote.id);
          updatedBookmarklist[listName] = updatedBookmarklist[listName].filter(
            (id) => id !== quote.id
          );
        }
      }

      setUser({
        ...user,
        bookmarklist: updatedBookmarklist,
      });

      SnackbarService.show('Changes saved successfully.');
      bottomSheetRef.current?.close(); // Use our custom method
    } catch (error) {
      console.error('Error saving changes:', error);
      SnackbarService.show('Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewListClick = () => {
    if (Object.keys(bookmarklist).length >= MAX_LISTS) {
      SnackbarService.show(
        isPro
          ? `You can only create up to ${PREMIUM_MAX_LISTS} lists.`
          : `Free users can only create up to ${FREE_MAX_LISTS} lists. Upgrade to Pro for up to ${PREMIUM_MAX_LISTS} lists!`
      );
      return;
    }
    setShowInput(true);
  };

  const handleCancelNewList = () => {
    setShowInput(false);
    setListName('');
  };

  const handleCreateNewList = async () => {
    if (!listName.trim()) {
      SnackbarService.show('Please enter a list name');
      return;
    }

    setLoading(true);
    try {
      // Check if list name already exists
      if (bookmarklist[listName]) {
        SnackbarService.show('A list with this name already exists');
        return;
      }

      // Create new list and add quote to it
      const updatedBookmarklist = {
        ...bookmarklist,
        [listName]: [quote.id],
      };

      // Update Firestore
      await addQuoteToList(user.uid, listName, quote.id);

      // Update local state
      setUser({
        ...user,
        bookmarklist: updatedBookmarklist,
      });

      // Reset UI
      setListName('');
      setShowInput(false);

      // Update selection state to include the new list
      setTempSelection((prev) => ({
        ...prev,
        [listName]: true,
      }));

      SnackbarService.show('New list created successfully');
    } catch (error) {
      console.error('Error creating new list:', error);
      SnackbarService.show('Failed to create new list');
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(COLORS);

  return (
    <Portal>
      <BottomSheet ref={bottomSheetRef} height='60%'>
        <View style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Manage Your Lists</Text>

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
                  onPress={handleCreateNewList}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                  labelStyle={styles.buttonText}
                >
                  Create List
                </Button>
                <Button
                  mode='text'
                  onPress={handleCancelNewList}
                  style={styles.cancelButton}
                  labelStyle={styles.cancelButtonText}
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

          <Text style={styles.existingListsTitle}>
            Your Lists ({Object.keys(bookmarklist).length} / {MAX_LISTS})
          </Text>
          {!isPro && (
            <Text style={styles.noListsText}>
              Free users can create up to {FREE_MAX_LISTS} lists.{' '}
              <Text
                style={{ color: COLORS.primary, fontWeight: 'bold' }}
                onPress={() => {
                  router.push('/profile/pro/');
                }}
              >
                Upgrade to Pro for more lists!
              </Text>
            </Text>
          )}
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

          <Button
            mode='contained'
            onPress={handleSaveChanges}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
            labelStyle={styles.buttonText}
          >
            Save Changes
          </Button>
        </View>
      </BottomSheet>
    </Portal>
  );
});

const getStyles = (COLORS) =>
  StyleSheet.create({
    bottomSheetContent: {
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
      backgroundColor: COLORS.surface,
    },
    newListActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    button: {
      flex: 1,
      marginRight: 8,
      backgroundColor: COLORS.primary,
    },
    buttonText: {
      color: COLORS.onPrimary,
    },
    cancelButton: {
      flex: 1,
    },
    cancelButtonText: {
      color: COLORS.placeholder,
    },
    newListButton: {
      padding: 16,
      backgroundColor: COLORS.surface,
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
      backgroundColor: COLORS.primary,
    },
  });

export default ListManager;

