import { useEffect } from "react";
import { Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uploadQuotes } from "utils/firebase/firestore";

const CURRENT_VERSION = "1";

export default function Index() {
  useEffect(() => {
    const uploadIfVersionChanged = async () => {
      try {
        const savedVersion = await AsyncStorage.getItem("quotes_version");
        if (savedVersion !== CURRENT_VERSION) {
          // Upload quotes if the version has changed
          await uploadQuotes();
          console.log("Quotes uploaded for version:", CURRENT_VERSION);

          // Save the new version to AsyncStorage
          await AsyncStorage.setItem("quotes_version", CURRENT_VERSION);
        } else {
          console.log("Quotes are already up-to-date.");
        }
      } catch (error) {
        console.error("Error uploading quotes:", error);
      }
    };

    uploadIfVersionChanged();
  }, []);

  return (
    <View>
      <Text>Home Home</Text>
    </View>
  );
}
