import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      isGuest: false,
      setUser: (user) => set({ user, isGuest: false }),
      setGuest: () => set({ isGuest: true, user: null }),
      resetUser: () => set({ user: null, isGuest: false }),
    }),
    {
      name: "user-storage",
      getStorage: () => AsyncStorage,
    }
  )
);

export default useUserStore;
