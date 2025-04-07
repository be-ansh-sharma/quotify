import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import useUserStore from 'stores/userStore';

export default function Entry() {
  const router = useRouter();
  const setGuest = useUserStore((state) => state.setGuest);

  const guestHandler = () => {
    setGuest();
    router.replace('/(tabs)/home');
  };
  return (
    <View>
      <Button mode='outlined' onPress={() => router.navigate('/auth/login')}>
        Login
      </Button>
      <Button mode='outlined' onPress={() => router.navigate('/auth/register')}>
        Register
      </Button>
      <Button mode='outlined' onPress={guestHandler}>
        Guest
      </Button>
    </View>
  );
}

