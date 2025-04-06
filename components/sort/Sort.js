import { useState } from 'react';
import { View } from 'react-native';
import { Text, Menu, Divider, IconButton, useTheme } from 'react-native-paper';
import useUserStore from 'stores/userStore';

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Most Popular', value: 'mostPopular' },
  { label: 'A-Z by Author', value: 'a_z_author' },
  { label: 'Z-A by Author', value: 'z_a_author' },
];

export default function Sort({ selectedSort }) {
  const setSelectedSort = useUserStore((state) => state.setSelectedSort);
  const [visible, setVisible] = useState(false);
  const theme = useTheme(); // Access the app's theme

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSortSelection = (sortOption) => {
    setSelectedSort(sortOption);
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

