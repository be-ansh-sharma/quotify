import useUserStore from 'stores/userStore';

export function useTheme() {
  const colors = useUserStore((state) => state.getThemeColors());
  const isDark = useUserStore((state) => state.isDarkMode());

  return {
    colors,
    isDark,
  };
}

