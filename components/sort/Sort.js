import { useState } from 'react';
import { View } from 'react-native';
import { Text, Menu, Divider, IconButton, useTheme } from 'react-native-paper';
import useUserStore from 'stores/userStore'; // Import user store to check if the user is a guest

export default function Sort({ selectedSort, sortOptions, sortHandler }) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme(); // Access the app's theme
  const isGuest = useUserStore((state) => state.isGuest); // Check if the user is a guest

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSortSelection = (sortOption) => {
    sortHandler(sortOption);
    closeMenu();
  };

  return (
    <View style={{ padding: 20 }}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <View>
            <IconButton
              icon='sort'
              size={24}
              onPress={openMenu}
              style={{ marginBottom: 10 }}
            />
          </View>
        }
      >
        {sortOptions.map((option, index) => {
          // Disable "Favorite Author" option if the user is a guest
          const isDisabled = isGuest && option.value === 'favoriteAuthor';

          return (
            <Menu.Item
              key={index}
              onPress={() => !isDisabled && handleSortSelection(option.value)} // Prevent selection if disabled
              title={option.label}
              titleStyle={
                isDisabled
                  ? { color: theme.colors.disabled } // Use disabled color for guests
                  : selectedSort === option.value
                  ? { color: theme.colors.primary, fontWeight: 'bold' } // Highlight selected option
                  : {}
              }
              style={
                selectedSort === option.value && !isDisabled
                  ? { backgroundColor: theme.colors.surface } // Highlight background for selected option
                  : {}
              }
              disabled={isDisabled} // Disable the option if the user is a guest
            />
          );
        })}
        <Divider />
      </Menu>
    </View>
  );
}

