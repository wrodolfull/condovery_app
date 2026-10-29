import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={() => null}>
      <Tabs.Screen name="index" options={{ title: "Início" }} />
      <Tabs.Screen name="explorar" options={{ title: "Explorar" }} />
      <Tabs.Screen name="salvos" options={{ title: "Salvos" }} />
      <Tabs.Screen name="pedidos" options={{ title: "Pedidos" }} />
      <Tabs.Screen name="conta" options={{ title: "Conta" }} />
    </Tabs>
  );
}
