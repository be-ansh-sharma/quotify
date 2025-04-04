import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#121212",
  },
  form: {
    width: "100%",
    maxWidth: 400,
    padding: 20,
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
  },
  helperText: {
    color: "#FF6F61",
  },
});

export default styles;
