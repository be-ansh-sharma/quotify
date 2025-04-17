import { Text, View } from 'react-native';
import { auth } from 'utils/firebase/firebaseconfig';
import { useRouter } from 'expo-router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native-paper';
import useUserStore from 'stores/userStore';
import { enableScreens } from 'react-native-screens';

enableScreens();

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const isGuest = useUserStore((state) => state.isGuest);
  const [isLayoutMounted, setIsLayoutMounted] = useState(false);

  // Simulate layout mounting
  useEffect(() => {
    const timeout = setTimeout(() => setIsLayoutMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isLayoutMounted || loading) return;

    if (user || isGuest) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/auth/entry');
    }
  }, [user, loading, isGuest, router, isLayoutMounted]);

  if (loading || !isLayoutMounted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' color='#0000ff' />
      </View>
    );
  }

  return null;
}

