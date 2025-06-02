import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import useUserStore from 'stores/userStore';
import AdManager from 'utils/ads/AdManager';

export default function NavigationMiddleware({ children }) {
  const currentPath = usePathname();
  const previousPathRef = useRef(currentPath);
  const user = useUserStore((state) => state.user);
  const isPremium = useUserStore((state) => state?.user?.isPro);

  // Track navigation changes for ads
  useEffect(() => {
    const previousPath = previousPathRef.current;

    // Only track if paths actually changed
    if (currentPath !== previousPath) {
      // Check if we should show an interstitial ad
      if (!isPremium && user?.uid) {
        AdManager.onNavigation(isPremium, previousPath, currentPath);
      }

      // Update the previous path reference
      previousPathRef.current = currentPath;
    }
  }, [currentPath, isPremium, user?.uid]);

  return children;
}

