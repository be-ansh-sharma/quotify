import { create } from 'zustand';
import { createJSONStorage, persist } from 'expo-zustand-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useUserStore = create(
  persist(
    (set) => ({
      user: {
        uid: null,
        email: null,
        name: null,
        bookmarked: [], // Initialize as an empty array
      },
      isGuest: false,
      selectedSort: 'newest',
      hasCheckedProfileOnce: false, // 👈 New flag
      setSelectedSort: (sort) => set({ selectedSort: sort }),
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
      setHasCheckedProfileOnce: (val) => set({ hasCheckedProfileOnce: val }), // 👈 Setter
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useUserStore;

