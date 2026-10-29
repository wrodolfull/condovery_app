import { useEffect, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronRight,
  Heart,
  Home,
  LayoutGrid,
  Receipt,
  ShoppingBag,
  UserRound,
} from "lucide-react-native";
import { useMarket } from "./market";
import { colors } from "./theme";
import { T } from "./ui";

// One shared bar also covers shop, product, fair and checkout stack screens.
const items = [
  ["/", "Início", Home],
  ["/explorar", "Explorar", LayoutGrid],
  ["/salvos", "Salvos", Heart],
  ["/pedidos", "Pedidos", Receipt],
  ["/conta", "Conta", UserRound],
] as const;

export function BuyerNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { cart } = useMarket();
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboard(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboard(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  if (keyboard) return null;
  return (
    <>
      {count > 0 && pathname !== "/carrinho" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ver carrinho, ${count} ${count === 1 ? "item" : "itens"}`}
          onPress={() => router.navigate("/carrinho")}
          style={[
            styles.cart,
            {
              bottom: 91 + insets.bottom,
              left: 11 + insets.left,
              right: 11 + insets.right,
            },
          ]}
        >
          <ShoppingBag color="white" size={21} />
          <T bold style={{ color: "white", flex: 1 }}>
            {count} {count === 1 ? "item" : "itens"} · Ver carrinho
          </T>
          <ChevronRight color="white" size={18} />
        </Pressable>
      )}
      <View
        accessibilityLabel="Navegação principal"
        style={[
          styles.bar,
          {
            bottom: 12 + insets.bottom,
            left: 10 + insets.left,
            right: 10 + insets.right,
          },
        ]}
      >
        {items.map(([href, label, Icon]) => {
          const selected = pathname === href;
          return (
            <Pressable
              key={href}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              aria-selected={selected}
              onPress={() => {
                Keyboard.dismiss();
                router.navigate(href);
              }}
              style={styles.item}
            >
              <View
                style={
                  selected
                    ? [
                        styles.active,
                        { paddingHorizontal: width <= 420 ? 7 : 10 },
                      ]
                    : undefined
                }
              >
                <Icon
                  size={22}
                  color={selected ? "#28231B" : "#CCC7BE"}
                  strokeWidth={selected ? 2.4 : 1.8}
                />
              </View>
              <T
                bold
                style={{
                  color: selected ? "#FFDB3A" : "#CCC7BE",
                  fontSize: Math.min(11, Math.max(9, width * 0.025)),
                  lineHeight: Math.min(11, Math.max(9, width * 0.025)) * 1.5,
                }}
              >
                {label}
              </T>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.nav,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 5,
    boxShadow: "0 12px 30px rgba(30,22,15,.28)",
  },
  item: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  active: {
    backgroundColor: colors.yellow,
    borderRadius: 100,
    paddingVertical: 5,
  },
  cart: {
    position: "absolute",
    borderRadius: 999,
    padding: 15,
    backgroundColor: colors.nav,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
