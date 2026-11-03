import React, { useEffect, useState } from "react";
import { loadPrivateMedia } from "./private-media";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type RefreshControlProps,
  type TextProps,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { router } from "expo-router";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Heart,
  Minus,
  ShoppingBasket,
  Search,
  X,
  Plus,
  ShoppingBag,
  Store,
} from "lucide-react-native";
import { colors, fonts, money } from "./theme";
import { useAuth } from "./auth";
import { useMarket } from "./market";
import { useQuery } from "@tanstack/react-query";
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
          fontFamily: heading ? fonts.display : bold ? fonts.bold : fonts.body,
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
export function SearchBox({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View
      style={{
        height: 54,
        backgroundColor: "#FFFEFB",
        borderWidth: 1,
        borderColor: "#EDE6DC",
        borderRadius: 28,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 17,
        boxShadow: "0 8px 22px rgba(58,45,25,.04)",
      }}
    >
      <Search size={20} color="#71756F" />
      <TextInput
        accessibilityLabel="Buscar produtos ou lojas"
        placeholder="Busque produtos ou lojas..."
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          fontSize: 14,
          fontFamily: fonts.body,
          outlineWidth: 0,
          color: colors.ink,
        }}
        returnKeyType="search"
      />
      {!!value && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          onPress={() => onChangeText("")}
          hitSlop={10}
        >
          <X size={16} color={colors.ink} />
        </Pressable>
      )}
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
  backLabel = "Voltar",
  refreshControl,
  scrollable = true,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  title?: string;
  back?: boolean;
  backLabel?: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  const { viewer, api } = useAuth();
  const { data: pushSummary } = useQuery<{ unread_count: number }>({
    queryKey: ["push/summary", viewer?.id, viewer?.condominium_id],
    queryFn: () => api.request<{ unread_count: number }>("push/summary"),
    enabled: !!viewer,
    staleTime: 5000,
    refetchInterval: 20000, // Inbox badge works even when remote push is disabled.
    refetchOnMount: "always",
    retry: false,
  });
  const unreadCount = Math.max(0, pushSummary?.unread_count ?? 0);
  const { cart } = useMarket();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const horizontal = width <= 420 ? 15 : 20;
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "left", "right"]}
    >
      <View style={[s.header, { paddingHorizontal: horizontal }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Elevadoor, início"
          onPress={() => router.navigate("/")}
        >
          <T
            heading
            style={{ fontSize: width <= 420 ? 23 : 25, letterSpacing: -1.5 }}
          >
            elevadoor<T style={{ fontSize: 27, color: colors.orange }}>.</T>
          </T>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          {!viewer && <T heading style={{ fontSize: 18 }}>{title}</T>}
        </View>
        {viewer && (
          <View style={{ flexDirection: "row", gap: 5 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Acessar minha loja"
              onPress={() => router.navigate("/vendedor")}
              style={s.headerAction}
            >
              <Store size={21} color={colors.ink} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notificações"
              onPress={() => router.navigate("/notificacoes")}
              style={s.headerAction}
            >
              <Bell size={20} color={colors.ink} />
              {unreadCount > 0 && (
                <View
                  accessibilityLabel={unreadCount+" notificações não lidas"}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: "#E02B35",
                    borderWidth: 1,
                    borderColor: "white",
                  }}
                />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir carrinho"
              onPress={() => router.navigate("/carrinho")}
              style={s.headerAction}
            >
              <ShoppingBag size={22} color={colors.ink} />
              {count > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    backgroundColor: colors.orange,
                    borderRadius: 20,
                    minWidth: 17,
                    alignItems: "center",
                    paddingHorizontal: 3,
                  }}
                >
                  <T
                    bold
                    style={{ color: "white", fontSize: 10, lineHeight: 17 }}
                  >
                    {count}
                  </T>
                </View>
              )}
            </Pressable>
          </View>
        )}
      </View>
      {scrollable ? <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingHorizontal: horizontal,
          paddingTop: width <= 420 ? 20 : 24,
          paddingBottom: 180 + insets.bottom,
          gap: 20,
        }}
      >
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              alignSelf: "flex-start",
              minHeight: 35,
            }}
          >
            <ArrowLeft size={18} color={colors.ink} />
            <T bold style={{ fontSize: 12 }}>
              {backLabel}
            </T>
          </Pressable>
        )}
        {children}
      </ScrollView> : <View style={{ flex: 1 }}>{children}</View>}
    </SafeAreaView>
  );
}
export function Picture({
  path,
  label,
  height = 160,
  aspectRatio,
  radius = 18,
  fallback,
}: {
  path?: string | null;
  label: string;
  height?: number;
  aspectRatio?: number;
  radius?: number;
  fallback?: React.ReactNode;
}) {
  const { viewer, api } = useAuth();
  const source = api.image(path, viewer?.id ?? "");
  const sourceUri = source?.uri ?? "";
  const token = source?.headers.Authorization?.replace(/^Bearer /, "") ?? "";
  const mediaKey = sourceUri + "|" + token;
  const [resolved, setResolved] = useState<{ key: string; uri: string | null } | null>(null);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS === "web" || !sourceUri || !token) return;
    let mounted = true;
    void loadPrivateMedia(sourceUri, token, api.origin).then(
      (uri) => { if (mounted) setResolved({ key: mediaKey, uri }); },
      () => { if (mounted) setResolved({ key: mediaKey, uri: null }); },
    );
    return () => { mounted = false; };
  }, [sourceUri, token, mediaKey, api.origin]);
  const displayUri = Platform.OS === "web"
    ? sourceUri
    : resolved?.key === mediaKey ? resolved.uri : null;
  const failed = (Platform.OS === "web" && failedUri === sourceUri) ||
    (Platform.OS !== "web" && resolved?.key === mediaKey && !resolved.uri);
  const shape = {
    width: "100%" as const,
    ...(aspectRatio ? { aspectRatio } : { height }),
    borderRadius: radius,
    overflow: "hidden" as const,
    backgroundColor: "#EEE8DC",
  };
  return source && displayUri && !failed ? (
    <Image
      onError={() => setFailedUri(source.uri)}
      accessibilityLabel={label}
      source={Platform.OS === "web" ? source : { uri: displayUri }}
      style={shape}
      resizeMode="cover"
    />
  ) : (
    <View style={shape}>
      {fallback ?? (
        <LinearGradient
          colors={["#E9E4D2", "#F7EAD0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
          }}
        >
          <ShoppingBasket color="#BE9162" size={35} />
          <T heading style={{ color: "#9C8864", fontSize: 11 }}>
            feito por vizinhos
          </T>
        </LinearGradient>
      )}
    </View>
  );
}
export function ProductCard({
  product: p,
  width,
}: {
  product: Product;
  width?: number | "100%";
}) {
  const market = useMarket();
  const fav = market.favorites.data?.ids.includes(p.id);
  const closed = p.is_open === false;
  const unavailable = closed || p.stock === 0 || p.visibility !== "available";
  const openProduct=()=>router.push({
    pathname: "/produto/[shop]/[id]",
    params: {shop:p.shop_id,id:p.id},
  });
  return (
    <View
      style={[
        s.product,
        {
          width: width ?? "100%",
          backgroundColor: unavailable ? "#F0F0EE" : "#FFFCF8",
          opacity: closed ? 0.65 : 1,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Ver " + p.name}
        accessibilityState={{disabled:unavailable}}
        disabled={unavailable}
        onPress={openProduct}
        style={{ opacity: unavailable ? 0.48 : 1, flex: 1 }}
      >
        <View style={{ position: "relative" }}>
          <Picture path={p.image_url} label={p.name} aspectRatio={1} />
        </View>
        {p.promo_price_cents != null && (
          <View
            style={{
              position: "absolute",
              top: 9,
              left: 9,
              backgroundColor: "#F7653C",
              borderRadius: 999,
              paddingVertical: 5,
              paddingHorizontal: 10,
            }}
          >
            <T bold style={{ color: "white", fontSize: 10, lineHeight: 15 }}>
              Oferta
            </T>
          </View>
        )}
        <View
          style={{
            paddingTop: 12,
            paddingHorizontal: 11,
            paddingBottom: 14,
            gap: 1,
            flex: 1,
            minHeight: 95,
            opacity: unavailable ? 0.72 : 1,
          }}
        >
          <T bold numberOfLines={2} style={{ fontSize: 14, lineHeight: 19 }}>
            {p.name}
          </T>
          <T
            numberOfLines={1}
            style={{ fontSize: 11, lineHeight: 17, color: colors.muted }}
          >
            {p.shop_name}
          </T>
          <View
            testID="product-price-footer"
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 8,
              marginTop: "auto",
              paddingTop: 8,
            }}
          >
            <View style={{ flex: 1, minWidth: 0, alignItems: "flex-start", gap: 1 }}>
              {p.promo_price_cents != null && (
                <T
                  style={{
                    fontSize: 10,
                    color: "#898B85",
                    textDecorationLine: "line-through",
                  }}
                >
                  {money(p.price_cents)}
                </T>
              )}
              <T bold style={{ fontSize: 15 }}>
                {money(p.promo_price_cents ?? p.price_cents)}
              </T>
            </View>
            {!unavailable && (
              <Pressable
                testID="product-add-hint"
                accessibilityRole="button"
                accessibilityLabel={"Abrir " + p.name}
                onPress={event=>{
                  event.stopPropagation();
                  openProduct();
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.yellow,
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,.92)",
                  boxShadow: "0 3px 12px rgba(36,27,13,.12)",
                }}
              >
                <Plus size={22} strokeWidth={3} color={colors.ink} />
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
      {unavailable && (
        <View
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            backgroundColor: "#494945",
            borderRadius: 99,
            paddingVertical: 7,
            paddingHorizontal: 10,
          }}
          pointerEvents="none"
        >
          <T bold style={{ fontSize: 10, color: "white", lineHeight: 15 }}>
            {closed ? "Loja fechada" : p.stock === 0 ? "Esgotado" : "Indisponível"}
          </T>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          fav ? "Remover dos favoritos" : "Salvar nos favoritos"
        }
        accessibilityState={{ selected: !!fav, disabled: closed }}
        disabled={closed}
        onPress={() => market.toggleFavorite(p.id).catch(alertError)}
        style={{
          position: "absolute",
          right: 10,
          top: 10,
          borderRadius: 99,
          width: 35,
          height: 35,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(255,255,255,.95)",
          boxShadow: "0 2px 11px rgba(43,30,10,.13)",
        }}
      >
        <Heart
          size={18}
          fill={fav ? "#ED6043" : "none"}
          color={fav ? "#ED6043" : "#585650"}
        />
      </Pressable>
    </View>
  );
}
export function ProductGrid({ products }: { products: Product[] }) {
  // Use explicit two-item rows, not flexWrap with measured pixel widths.
  // Yoga can round two half-width cards + gap over the available space on
  // Android and unexpectedly wrap every second card onto a new line.
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }
  return (
    <View style={{ width: "100%", gap: 15 }}>
      {rows.map((items) => (
        <View
          key={items[0].id}
          style={{ width: "100%", flexDirection: "row", gap: 15 }}
        >
          {items.map((p) => (
            <View key={p.id} style={{ flex: 1, minWidth: 0 }}>
              <ProductCard product={p} width="100%" />
            </View>
          ))}
          {items.length === 1 && <View style={{ flex: 1, minWidth: 0 }} />}
        </View>
      ))}
    </View>
  );
}
export function ShopLogo({
  shop,
  size = 70,
  coverFallback = false,
}: {
  shop: Shop;
  size?: number;
  coverFallback?: boolean;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: "#FFEBC2",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Picture
        path={shop.logo_image ?? (coverFallback ? shop.cover_image : null)}
        label={shop.name}
        height={size}
        radius={size / 2}
        fallback={
          <View
            style={{
              flex: 1,
              backgroundColor: "#FFEBC2",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Store size={27} color="#AC7936" />
          </View>
        }
      />
    </View>
  );
}
export function ShopRow({ shop }: { shop: Shop }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={"Ver loja " + shop.name}
      onPress={() =>
        router.push({ pathname: "/loja/[id]", params: { id: shop.id } })
      }
      style={{
        opacity: shop.is_open ? 1 : 0.58,
        backgroundColor: shop.is_open ? colors.card : "#EEEEEC",
        borderWidth: 1,
        borderColor: "#ECE7DB",
        padding: 12,
        borderRadius: 17,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
      }}
    >
      <ShopLogo shop={shop} coverFallback />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T bold>{shop.name}</T>
        <T numberOfLines={1} style={{ fontSize: 12, color: colors.muted }}>
          {shop.description || "Conheça os produtos dessa loja"}
        </T>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 4,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: shop.is_open ? colors.green : colors.muted,
            }}
          />
          <T
            bold
            style={{
              fontSize: 11,
              lineHeight: 17,
              color: shop.is_open ? colors.green : colors.muted,
            }}
          >
            {shop.is_open ? "Aceitando pedidos" : "Fechada"}
          </T>
        </View>
      </View>
      <ChevronRight color="#777777" size={20} />
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
        marginTop: 11,
        marginBottom: -5,
      }}
    >
      <T
        heading
        style={{
          fontSize: 21,
          lineHeight: 26.25,
          letterSpacing: -0.5,
          flex: 1,
        }}
      >
        {title}
      </T>
      {action && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            paddingVertical: 6,
          }}
        >
          <T bold style={{ fontSize: 12, color: "#D65C39" }}>
            {action}
          </T>
          <ChevronRight size={14} color="#D65C39" />
        </Pressable>
      )}
    </View>
  );
}
export function Quantity({
  value,
  onChange,
  min = 0,
  max = 30,
  variant = "plain",
  collapseWhenZero = false,
  label = "item",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  variant?: "plain" | "boxed";
  collapseWhenZero?: boolean;
  label?: string;
}) {
  const boxed = variant === "boxed";
  if (collapseWhenZero && value === 0) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Adicionar " + label}
        accessibilityState={{ disabled: max <= 0 }}
        disabled={max <= 0}
        onPress={() => onChange(1)}
        style={{
          width: 44, height: 44, alignItems: "center", justifyContent: "center",
          borderRadius: 22, backgroundColor: "#FFF7E8",
          borderWidth: 1, borderColor: colors.line,
          opacity: max <= 0 ? 0.35 : 1,
        }}
      >
        <Plus size={23} color={colors.ink} />
      </Pressable>
    );
  }
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: boxed ? 6 : 15,
      ...(boxed ? {
        backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
        borderRadius: 15, padding: 4,
      } : {}),
    }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Diminuir quantidade de " + label}
        accessibilityState={{ disabled: value <= min }}
        disabled={value <= min}
        hitSlop={6}
        onPress={() => onChange(value - 1)}
        style={boxed ? {
          width: 37, height: 37, borderRadius: 12,
          alignItems: "center", justifyContent: "center",
          backgroundColor: "#F5F4F1", opacity: value <= min ? 0.4 : 1,
        } : undefined}
      >
        <Minus size={20} color={colors.ink} />
      </Pressable>
      <T bold style={boxed ? { minWidth: 19, textAlign: "center", fontSize: 15 } : undefined}>
        {value}
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"Aumentar quantidade de " + label}
        accessibilityState={{ disabled: value >= max }}
        disabled={value >= max}
        hitSlop={6}
        onPress={() => onChange(value + 1)}
        style={boxed ? {
          width: 37, height: 37, borderRadius: 12,
          alignItems: "center", justifyContent: "center",
          backgroundColor: "#F5F4F1", opacity: value >= max ? 0.4 : 1,
        } : undefined}
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
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDFCF7",
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  headerAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF7E8",
    alignItems: "center",
    justifyContent: "center",
  },
  product: {
    backgroundColor: colors.card,
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 6px 25px rgba(36,27,13,.055)",
  },
});
