import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import styles from "./LoginForm.style"; // Importing the styles
import { useRouter } from "expo-router";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "utils/firebase/firebaseconfig";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [authError, setAuthError] = useState(null); // Handle Firebase auth errors
  const router = useRouter();
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);

  useEffect(() => {
    if (user) {
      console.log("User logged in successfully:", user);
      router.navigate("/(tabs)/home");
    }
  }, [user]);

  const validate = () => {
    let valid = true;

    // Email regex for basic validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      valid = false;
    } else {
      setEmailError(null);
    }

    if (!password || password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    } else {
      setPasswordError(null);
    }

    return valid;
  };

  const handleLogin = async () => {
    if (validate()) {
      try {
        await signInWithEmailAndPassword(email, password);
      } catch (error) {
        console.error(error.message);
        setAuthError("Invalid email or password. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!emailError}
          style={styles.input}
        />
        {emailError && (
          <HelperText type="error" style={styles.helperText}>
            {emailError}
          </HelperText>
        )}

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={!!passwordError}
          style={styles.input}
        />
        {passwordError && (
          <HelperText type="error" style={styles.helperText}>
            {passwordError}
          </HelperText>
        )}

        {authError && (
          <HelperText type="error" style={styles.helperText}>
            {authError}
          </HelperText>
        )}

        <Button mode="contained" onPress={handleLogin} style={styles.button}>
          Login
        </Button>
      </View>
    </View>
  );
};

export default LoginForm;
