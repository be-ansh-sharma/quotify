import { useState } from 'react';
import { View } from 'react-native';
import { Menu, Divider, IconButton, useTheme } from 'react-native-paper';
import useUserStore from 'stores/userStore';

export default function Sort({ selectedSort, sortOptions, sortHandler }) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  const isGuest = useUserStore((state) => state.isGuest);

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
        paddingHorizontal: 16,
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
          marginTop: 4, // optional spacing between icon and menu
        }}
      >
        {sortOptions.map((option, index) => {
          const isDisabled = isGuest && option.value === 'favoriteAuthor';

          return (
            <Menu.Item
              key={index}
              onPress={() => !isDisabled && handleSortSelection(option.value)}
              title={option.label}
              titleStyle={
                isDisabled
                  ? { color: theme.colors.disabled }
                  : selectedSort === option.value
                  ? { color: theme.colors.primary, fontWeight: 'bold' }
                  : {}
              }
              style={
                selectedSort === option.value && !isDisabled
                  ? { backgroundColor: theme.colors.surface }
                  : {}
              }
              disabled={isDisabled}
            />
          );
        })}
        <Divider />
      </Menu>
    </View>
  );
}

