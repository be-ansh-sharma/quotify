import React, { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import InterstitialAdManager from 'utils/ads/InterstitialAdManager';
import useUserStore from 'stores/userStore';

export default function NavigationMiddleware({ children }) {
  const currentPath = usePathname();
  const previousPathRef = useRef(currentPath);
  const isPremium = useUserStore((state) => state?.user?.isPro);

  useEffect(() => {
    if (previousPathRef.current && previousPathRef.current !== currentPath) {
      // Track the navigation event
      InterstitialAdManager.trackNavigation(isPremium);
    }

    // Update the previous path reference
    previousPathRef.current = currentPath;
  }, [currentPath, isPremium]);

  return <>{children}</>;
}

