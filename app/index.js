import React from 'react';
import { View, Text } from 'react-native';
import { COLORS } from 'styles/theme';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  React.useEffect(() => {
    // Redirect after a short delay
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
      }}
    >
      <Text style={{ color: COLORS.text, fontSize: 16 }}>Redirecting...</Text>
    </View>
  );
}

