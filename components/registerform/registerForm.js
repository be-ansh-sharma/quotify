import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import styles from "./registerForm.style"; // Importing the styles
import { useRouter } from "expo-router";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "utils/firebase/firebaseconfig";

const RegisterForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);
  const router = useRouter();
  const [createUserWithEmailAndPassword, user, loading, error] =
    useCreateUserWithEmailAndPassword(auth);

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

    if (!confirmPassword || confirmPassword !== password) {
      setConfirmPasswordError("Passwords must match");
      valid = false;
    } else {
      setConfirmPasswordError(null);
    }

    return valid;
  };

  const handleRegister = async () => {
    if (validate()) {
      try {
        await createUserWithEmailAndPassword(email, password);
      } catch (error) {
        console.error(error.message);
      }
    }
  };

  useEffect(() => {
    if (user) {
      // Navigate after user is registered successfully
      console.log("User registered successfully:", user);
      router.navigate("/(tabs)/home"); // Navigate to tabs after registration
    }
  }, [user, router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading</Text>
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

        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          error={!!confirmPasswordError}
          style={styles.input}
        />
        {confirmPasswordError && (
          <HelperText type="error" style={styles.helperText}>
            {confirmPasswordError}
          </HelperText>
        )}

        <Button mode="contained" onPress={handleRegister} style={styles.button}>
          Register
        </Button>
      </View>
    </View>
  );
};

export default RegisterForm;
