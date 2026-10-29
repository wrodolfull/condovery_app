import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type RefreshControlProps,
  type TextProps,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { router, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Store,
} from "lucide-react-native";
import { colors, fonts, money } from "./theme";
import { useAuth } from "./auth";
import { useMarket } from "./market";
import type { Product, Shop } from "./types";
export function T({
  bold,
  heading,
  style,
  ...props
}: TextProps & { bold?: boolean; heading?: boolean }) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: heading ? fonts.heading : bold ? fonts.bold : fonts.body,
          color: colors.ink,
          fontSize: 14,
          lineHeight: heading ? undefined : 21,
        },
        style,
      ]}
    />
  );
}
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  busy = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      onPress={onPress}
      disabled={disabled || busy}
      style={[
        s.button,
        secondary && {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.line,
        },
        (disabled || busy) && { opacity: 0.5 },
      ]}
    >
      {busy ? <ActivityIndicator color={colors.ink} /> : <T bold>{title}</T>}
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <T bold style={{ fontSize: 12 }}>
        {label}
      </T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#999187"
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 90, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function ErrorBox({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return message ? (
    <View accessibilityRole="alert" style={s.error}>
      <T style={{ color: colors.danger }}>{message}</T>
      {retry && <Button title="Tentar novamente" onPress={retry} secondary />}
    </View>
  ) : null;
}
export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ paddingVertical: 35, alignItems: "center", gap: 12 }}>
      <ShoppingBag size={38} color={colors.orange} />
      <T heading style={{ fontSize: 20, textAlign: "center" }}>
        {title}
      </T>
      <T style={{ color: colors.muted, textAlign: "center" }}>{body}</T>
    </View>
  );
}
export function Loading() {
  return <ActivityIndicator color={colors.orange} style={{ margin: 28 }} />;
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Screen({
  children,
  title,
  back = false,
  refreshControl,
}: {
  children: React.ReactNode;
  title?: string;
  back?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  const { viewer } = useAuth();
  const pathname = usePathname();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "left", "right"]}
    >
      <View style={s.header}>
        {back ? (
          <Pressable
            accessibilityLabel="Voltar"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            hitSlop={12}
          >
            <ArrowLeft color={colors.ink} />
          </Pressable>
        ) : (
          <T heading style={{ fontSize: 24 }}>
            condovery<T style={{ fontSize: 27, color: colors.orange }}>.</T>
          </T>
        )}
        <View style={{ flex: 1 }}>
          {title ? (
            <T heading style={{ fontSize: 18 }}>
              {title}
            </T>
          ) : viewer ? (
            <>
              <T style={{ fontSize: 10, color: colors.muted }}>Você está em</T>
              <T bold numberOfLines={1} style={{ fontSize: 12 }}>
                {viewer?.condominium_name}
              </T>
            </>
          ) : null}
        </View>
        {viewer && (
          <Pressable
            accessibilityLabel="Notificações"
            onPress={() => router.push("/notificacoes")}
            hitSlop={10}
          >
            <Bell size={22} color={colors.ink} />
          </Pressable>
        )}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={refreshControl}
        contentContainerStyle={{ padding: 20, paddingBottom: 180, gap: 20 }}
      >
        {children}
      </ScrollView>
      {viewer && pathname !== "/carrinho" && <FloatingCart />}
    </SafeAreaView>
  );
}
function FloatingCart() {
  const { cart } = useMarket();
  const count = cart.items.reduce((s, i) => s + i.quantity, 0);
  if (!count) return null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push("/carrinho")}
      style={s.cart}
    >
      <ShoppingBag color="white" size={21} />
      <T bold style={{ color: "white", flex: 1 }}>
        {count} {count === 1 ? "item" : "itens"} · Ver carrinho
      </T>
      <ChevronRight color="white" size={18} />
    </Pressable>
  );
}
export function Picture({
  path,
  label,
  height = 160,
}: {
  path?: string | null;
  label: string;
  height?: number;
}) {
  const { viewer, api } = useAuth();
  const source = api.image(path, viewer?.id ?? "");
  return source ? (
    <Image
      accessibilityLabel={label}
      source={source}
      style={{
        width: "100%",
        height,
        borderRadius: 18,
        backgroundColor: "#EEE8DC",
      }}
      resizeMode="cover"
    />
  ) : (
    <View
      style={{
        height,
        width: "100%",
        borderRadius: 18,
        backgroundColor: "#F3E9D7",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <ShoppingBag color="#A68B62" size={35} />
      <T style={{ color: "#A68B62", fontSize: 11 }}>feito por vizinhos</T>
    </View>
  );
}
export function ProductCard({
  product: p,
  width,
}: {
  product: Product;
  width?: number;
}) {
  const market = useMarket();
  const fav = market.favorites.data?.ids.includes(p.id);
  return (
    <View style={[s.product, { width: width ?? "48%" }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Ver " + p.name}
        onPress={() =>
          router.push({
            pathname: "/produto/[shop]/[id]",
            params: { shop: p.shop_id, id: p.id },
          })
        }
        style={{
          opacity: p.stock === 0 || p.visibility === "unavailable" ? 0.55 : 1,
        }}
      >
        <Picture path={p.image_url} label={p.name} height={145} />
        <View style={{ padding: 12, gap: 3 }}>
          {p.promo_price_cents != null && (
            <T bold style={{ fontSize: 10, color: colors.orange }}>
              OFERTA
            </T>
          )}
          <T bold numberOfLines={2}>
            {p.name}
          </T>
          <T numberOfLines={1} style={{ fontSize: 11, color: colors.muted }}>
            {p.shop_name}
          </T>
          {p.promo_price_cents != null && (
            <T
              style={{
                fontSize: 11,
                textDecorationLine: "line-through",
                color: colors.muted,
              }}
            >
              {money(p.price_cents)}
            </T>
          )}
          <T bold>{money(p.promo_price_cents ?? p.price_cents)}</T>
          {(p.stock === 0 || p.visibility === "unavailable") && (
            <T style={{ fontSize: 11 }}>
              {p.stock === 0 ? "Esgotado" : "Indisponível"}
            </T>
          )}
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          fav ? "Remover dos favoritos" : "Salvar nos favoritos"
        }
        onPress={() => market.toggleFavorite(p.id).catch((e) => alertError(e))}
        style={{
          position: "absolute",
          right: 8,
          top: 8,
          borderRadius: 30,
          padding: 9,
          backgroundColor: "white",
        }}
      >
        <Heart
          size={18}
          fill={fav ? colors.orange : "none"}
          color={fav ? colors.orange : colors.muted}
        />
      </Pressable>
    </View>
  );
}
export function ShopRow({ shop }: { shop: Shop }) {
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/loja/[id]", params: { id: shop.id } })
      }
      style={[s.card, { flexDirection: "row", alignItems: "center", gap: 12 }]}
    >
      <View style={{ width: 62 }}>
        {shop.logo_image ? (
          <Picture path={shop.logo_image} label={shop.name} height={62} />
        ) : (
          <Store color={colors.orange} size={36} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <T bold>{shop.name}</T>
        <T numberOfLines={1} style={{ fontSize: 12, color: colors.muted }}>
          {shop.description}
        </T>
        <T
          style={{
            fontSize: 11,
            color: shop.is_open ? colors.green : colors.muted,
          }}
        >
          {shop.is_open ? "Aceitando pedidos" : "Fechada"}
        </T>
      </View>
      <ChevronRight color={colors.muted} size={18} />
    </Pressable>
  );
}
export function Section({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <T heading style={{ fontSize: 22, lineHeight: 28, flex: 1 }}>
        {title}
      </T>
      {action && (
        <Pressable onPress={onAction}>
          <T bold style={{ fontSize: 12 }}>
            {action} ›
          </T>
        </Pressable>
      )}
    </View>
  );
}
export function Quantity({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
      <Pressable
        accessibilityLabel="Diminuir quantidade"
        hitSlop={10}
        onPress={() => onChange(value - 1)}
      >
        <Minus size={20} color={colors.ink} />
      </Pressable>
      <T bold>{value}</T>
      <Pressable
        accessibilityLabel="Aumentar quantidade"
        hitSlop={10}
        onPress={() => onChange(value + 1)}
      >
        <Plus size={20} color={colors.ink} />
      </Pressable>
    </View>
  );
}
export const alertError = (e: unknown) => {
  import("react-native").then(({ Alert }) =>
    Alert.alert(
      "Não foi possível concluir",
      e instanceof Error ? e.message : "Tente novamente.",
    ),
  );
};
export const s = StyleSheet.create({
  button: {
    minHeight: 49,
    backgroundColor: colors.yellow,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    minHeight: 48,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  error: { backgroundColor: "#FEEAE5", padding: 14, borderRadius: 15, gap: 10 },
  header: {
    minHeight: 70,
    paddingHorizontal: 20,
    gap: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDFCF7",
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  product: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: "hidden",
  },
  cart: {
    position: "absolute",
    bottom: 102,
    left: 20,
    right: 20,
    borderRadius: 999,
    padding: 15,
    backgroundColor: colors.nav,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
