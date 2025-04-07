import { useState } from 'react';
import { View } from 'react-native';
import { Text, Menu, Divider, IconButton, useTheme } from 'react-native-paper';

export default function Sort({ selectedSort, sortOptions, sortHandler }) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme(); // Access the app's theme

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
        {sortOptions.map((option, index) => (
          <Menu.Item
            key={index}
            onPress={() => handleSortSelection(option.value)}
            title={option.label}
            titleStyle={
              selectedSort === option.value
                ? { color: theme.colors.text } // Use theme's text color
                : {}
            }
            style={
              selectedSort === option.value
                ? { backgroundColor: theme.colors.primary } // Use theme's background color
                : {}
            }
          />
        ))}
        <Divider />
      </Menu>
    </View>
  );
}

