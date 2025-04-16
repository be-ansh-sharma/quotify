import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Title, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import useUserStore from 'stores/userStore';
import { COLORS } from 'styles/theme';

export default function Entry() {
  const router = useRouter();
  const setGuest = useUserStore((state) => state.setGuest);

  const guestHandler = () => {
    setGuest();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      <Title style={styles.title}>
        Welcome to the <Text style={{ color: COLORS.primary }}>Quotify</Text>
      </Title>
      <Text style={styles.subtitle}>Choose how you'd like to continue</Text>

      <View style={styles.buttonGroup}>
        <Button
          mode='contained'
          onPress={() => router.navigate('/auth/login')}
          style={[styles.button, { backgroundColor: COLORS.primary }]} // Set background color
          labelStyle={{ color: COLORS.icon }} // Ensure text color is white
        >
          Login
        </Button>

        <Button
          mode='outlined'
          onPress={() => router.navigate('/auth/register')}
          style={styles.button}
          labelStyle={{ color: COLORS.primary }} // Set text color to primary
        >
          Register
        </Button>

        <Button mode='text' onPress={guestHandler} style={styles.button}>
          Continue as Guest
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background, // adjust if you have a theme
  },
  title: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  buttonGroup: {
    gap: 16,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 6,
  },
});

