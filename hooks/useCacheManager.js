// hooks/useCacheManager.js
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { clearQuotesCacheIfStale } from 'utils/quotesCache';

export function useCacheManager() {
  // Check on mount
  useEffect(() => {
    clearQuotesCacheIfStale();

    // Also check when app comes to foreground
    const subscription = AppState.addEventListener(
      'change',
      async (nextAppState) => {
        if (nextAppState === 'active') {
          await clearQuotesCacheIfStale();
        }
      }
    );

    return () => subscription.remove();
  }, []);
}
