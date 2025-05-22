import { useState } from 'react';
import { View } from 'react-native';
import { Menu, Divider, IconButton, useTheme } from 'react-native-paper';

export default function Sort({ selectedSort, sortOptions, sortHandler }) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSortSelection = (sortOption) => {
    sortHandler(sortOption);
    closeMenu();
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-end',
      }}
    >
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <IconButton
            icon='sort'
            size={24}
            onPress={openMenu}
            style={{ marginBottom: 10 }}
          />
        }
        anchorPosition='bottom'
        contentStyle={{
          marginTop: 4,
        }}
      >
        {sortOptions.map((option, index) => (
          <Menu.Item
            key={index}
            onPress={() => handleSortSelection(option.value)}
            title={option.label}
            titleStyle={
              selectedSort === option.value
                ? { color: theme.colors.primary, fontWeight: 'bold' }
                : {}
            }
            style={
              selectedSort === option.value
                ? { backgroundColor: theme.colors.surface }
                : {}
            }
            disabled={false}
          />
        ))}
        <Divider />
      </Menu>
    </View>
  );
}

