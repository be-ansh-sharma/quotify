import { create } from 'zustand';
import { createJSONStorage, persist } from 'expo-zustand-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, LIGHT_COLORS } from 'styles/theme';

// Don't use hooks in store definitions
const useUserStore = create(
  persist(
    (set, get) => ({
      user: {
        uid: null,
        email: null,
        name: null,
        bookmarked: [],
      },
      isGuest: false,
      selectedSort: 'newest',
      selectedMood: 'all',
      hasCheckedProfileOnce: false,
      theme: 'system', // 'system', 'dark', or 'light'
      hydrated: false,
      systemIsDark: null, // Store the system theme here instead of calling hook

      // Theme getters - don't call hooks here
      getThemeColors: () => {
        const state = get();
        if (state.theme === 'system') {
          return state.systemIsDark !== false ? COLORS : LIGHT_COLORS;
        }
        return state.theme === 'dark' ? COLORS : LIGHT_COLORS;
      },

      isDarkMode: () => {
        const state = get();
        if (state.theme === 'system') {
          return state.systemIsDark !== false;
        }
        return state.theme === 'dark';
      },

      // Add a setter for the system theme
      setSystemTheme: (isDark) => set({ systemIsDark: isDark }),

      // Existing functions
      setTheme: (theme) => set({ theme }),
      setSelectedSort: (sort) => set({ selectedSort: sort }),
      setSelectedMood: (mood) => set({ selectedMood: mood }),
      setUser: (user) => set({ user }),
      setGuest: () =>
        set({
          isGuest: true,
          user: {
            uid: null,
            email: null,
            name: null,
          },
        }),
      resetUser: () =>
        set({
          user: {
            uid: null,
            email: null,
            name: null,
          },
          isGuest: false,
        }),
      resetGuest: () =>
        set({
          isGuest: false,
          user: {
            uid: null,
            email: null,
            name: null,
          },
        }),
      setHasCheckedProfileOnce: (val) => set({ hasCheckedProfileOnce: val }),
      setHydrated: (val) => set({ hydrated: val }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated?.(true);
      },
    }
  )
);

export default useUserStore;

