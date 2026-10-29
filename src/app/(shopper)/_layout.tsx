import { Stack } from "expo-router";
export default function Layout() {
  return (
    <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }} />
  );
}
