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
      selectedSort: 'newest',
      selectedMood: 'all',
      hasCheckedProfileOnce: false,
      theme: 'system', // 'system', 'dark', or 'light'
      hydrated: false,
      systemIsDark: null, // Store the system theme here instead of calling hook
      lastKnownUser: null, // Add lastKnownUser to state

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
      setUser: (user) =>
        set({
          user,
          lastAuthTimestamp: Date.now(),
        }),
      resetUser: () =>
        set((state) => ({
          lastKnownUser: state.user?.uid
            ? { ...state.user }
            : state.lastKnownUser,
          user: {
            uid: null,
            email: null,
            name: null,
          },
        })),
      setHasCheckedProfileOnce: (val) => set({ hasCheckedProfileOnce: val }),
      setHydrated: (val) => set({ hydrated: val }),

      isAuthenticated: () => {
        const state = get();
        return !!state.user?.uid;
      },

      wasAuthenticated: () => {
        const state = get();
        return !!state.user?.uid || !!state.lastKnownUser?.uid;
      },
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

