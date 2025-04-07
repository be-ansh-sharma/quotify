import { create } from 'zustand';
import { createJSONStorage, persist } from 'expo-zustand-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      isGuest: false,
      selectedSort: 'mostPopular',
      hasCheckedProfileOnce: false, // 👈 New flag
      setSelectedSort: (sort) => set({ selectedSort: sort }),
      setUser: (user) => set({ user, isGuest: false }),
      setGuest: () => set({ isGuest: true, user: null }),
      resetUser: () => set({ user: null, isGuest: false }),
      setHasCheckedProfileOnce: (val) => set({ hasCheckedProfileOnce: val }), // 👈 Setter
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useUserStore;

