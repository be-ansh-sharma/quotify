import { Text, View } from 'react-native';
import { auth } from 'utils/firebase/firebaseconfig';
import { useRouter } from 'expo-router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native-paper';
import useUserStore from 'stores/userStore';

export default function Home() {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const isGuest = useUserStore((state) => state.isGuest);

  useEffect(() => {
    if (loading) return;
    if (user || isGuest) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/auth/entry');
    }
  }, [user, loading, isGuest, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' color='#0000ff' />
      </View>
    );
  }

  return null;
}

