import { Stack } from "expo-router";
import { View } from "react-native";
import { BuyerNavigation } from "../../BuyerNavigation";
export default function Layout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }} />
      <BuyerNavigation />
    </View>
  );
}
