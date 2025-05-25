import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from 'utils/firebase/firebaseconfig';
import useUserStore from 'stores/userStore';
import { handleAuthentication } from 'utils/services/authServices';

export function useAuthNavigation(isLayoutMounted) {
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);
  const isStoresHydrated = useUserStore((state) => state.hydrated);
  const setHasCheckedProfileOnce = useUserStore(
    (state) => state.setHasCheckedProfileOnce
  );

  const [isInitialRouteSet, setIsInitialRouteSet] = useState(false);

  // Handle authentication for user after mount
  useEffect(() => {
    if (!isStoresHydrated || !isLayoutMounted) return;

    setHasCheckedProfileOnce(false);

    // Handle auth state - only for authenticated users
    if (user?.uid) {
      handleAuthentication(user, router).catch((err) => {
        console.error('Error in authentication:', err);
      });
    }
  }, [isStoresHydrated, isLayoutMounted, user?.uid]);

  return {
    user,
    authLoading,
    isStoresHydrated,
    isInitialRouteSet,
    setIsInitialRouteSet,
    router,
  };
}

