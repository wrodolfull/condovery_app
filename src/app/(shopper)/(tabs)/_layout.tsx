import { Tabs } from "expo-router";
import {
  Home,
  LayoutGrid,
  Heart,
  Receipt,
  UserRound,
} from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "../../../theme";
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: "#CCC7BE",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: "absolute",
          marginHorizontal: 17,
          bottom: Math.max(12, insets.bottom),
          borderTopWidth: 0,
          borderRadius: 99,
          backgroundColor: colors.nav,
          height: 66,
          paddingBottom: 7,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 10 },
      }}
    >
      {(
        [
          ["index", "Início", Home],
          ["explorar", "Explorar", LayoutGrid],
          ["salvos", "Salvos", Heart],
          ["pedidos", "Pedidos", Receipt],
          ["conta", "Conta", UserRound],
        ] as const
      ).map(([name, title, Icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, color }) => (
              <View
                style={{
                  backgroundColor: focused ? colors.yellow : "transparent",
                  borderRadius: 30,
                  paddingVertical: 4,
                  paddingHorizontal: 13,
                }}
              >
                <Icon size={20} color={focused ? colors.nav : color} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
