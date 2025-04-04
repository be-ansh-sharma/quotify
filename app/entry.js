import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button } from "react-native-paper";
import useUserStore from "stores/userStore";

export default function Entry() {
  const router = useRouter();
  const setGuest = useUserStore((state) => state.setGuest);

  const guestHandler = () => {
    console.log("guestHandler");
    setGuest();
  };
  return (
    <View>
      <Button mode="outlined" onPress={() => router.navigate("login")}>
        Login
      </Button>
      <Button mode="outlined" onPress={() => router.navigate("register")}>
        Register
      </Button>
      <Button mode="outlined" onPress={guestHandler}>
        Guest
      </Button>
    </View>
  );
}
