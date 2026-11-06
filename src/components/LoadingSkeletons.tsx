import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors } from "../theme";

const base = "#E9E5DC";

function Block({
  width = "100%",
  height,
  radius = 10,
  style,
}: {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: base },
        style,
      ]}
    />
  );
}

/** One inexpensive native-driven pulse per loading region; no extra dependency. */
function Pulse({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let mounted = true;
    let loop: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!mounted || reduceMotion) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.62,
              duration: 1050,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 1050,
              useNativeDriver: true,
            }),
          ]),
        );
        loop.start();
      })
      .catch(() => {
        // Static placeholders are preferable if accessibility detection fails.
      });

    return () => {
      mounted = false;
      loop?.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      accessible
      accessibilityLabel="Carregando conteúdo"
      accessibilityState={{ busy: true }}
      pointerEvents="none"
      style={[{ opacity }, style]}
    >
      {children}
    </Animated.View>
  );
}

function ProductShape() {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 20,
        backgroundColor: colors.card,
        overflow: "hidden",
        paddingBottom: 13,
        gap: 9,
      }}
    >
      <View style={{ width: "100%", aspectRatio: 1, backgroundColor: base }} />
      <View style={{ gap: 8, paddingHorizontal: 11 }}>
        <Block width="88%" height={14} />
        <Block width="55%" height={10} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 10 }}>
          <Block width="42%" height={18} />
          <Block width={40} height={40} radius={12} />
        </View>
      </View>
    </View>
  );
}

/** Mirrors the two-column product grid instead of jumping from a spinner to cards. */
export function SkeletonProductGrid({ rows = 2 }: { rows?: number }) {
  return (
    <Pulse style={{ gap: 15 }}>
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={{ flexDirection: "row", gap: 15 }}>
          <ProductShape />
          <ProductShape />
        </View>
      ))}
    </Pulse>
  );
}

function ShopShape() {
  return (
    <View style={{
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 17,
      backgroundColor: colors.card,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    }}>
      <Block width={64} height={64} radius={13} />
      <View style={{ flex: 1, gap: 8 }}>
        <Block width="68%" height={16} />
        <Block width="90%" height={11} />
        <Block width="48%" height={10} />
      </View>
    </View>
  );
}

export function SkeletonShopList({ count = 3 }: { count?: number }) {
  return (
    <Pulse style={{ gap: 10 }}>
      {Array.from({ length: count }, (_, index) => <ShopShape key={index} />)}
    </Pulse>
  );
}

export function SkeletonCategories() {
  return (
    <Pulse style={{ flexDirection: "row", gap: 15, overflow: "hidden" }}>
      {Array.from({ length: 4 }, (_, index) => (
        <View key={index} style={{ width: 72, alignItems: "center", gap: 7 }}>
          <Block width={58} height={58} radius={29} />
          <Block width={58} height={11} />
        </View>
      ))}
    </Pulse>
  );
}

export function SkeletonShopDetail() {
  return (
    <Pulse style={{ gap: 16 }}>
      <Block height={175} radius={22} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Block width={70} height={70} radius={35} />
        <View style={{ flex: 1, gap: 9 }}>
          <Block width="76%" height={23} />
          <Block width="45%" height={12} />
        </View>
      </View>
      <Block width="95%" height={12} />
      <Block width="72%" height={12} />
      <Block width="40%" height={15} />
      <View style={{ flexDirection: "row", gap: 15 }}>
        <ProductShape />
        <ProductShape />
      </View>
    </Pulse>
  );
}

export function SkeletonProductDetail() {
  return (
    <Pulse style={{ gap: 16 }}>
      <View style={{ width: "100%", aspectRatio: 1.15, backgroundColor: base, borderRadius: 25 }} />
      <Block width="82%" height={30} />
      <Block width="48%" height={12} />
      <Block width="98%" height={12} />
      <Block width="74%" height={12} />
      <Block width="36%" height={26} />
      <Block height={84} radius={18} />
      <Block height={52} radius={16} />
    </Pulse>
  );
}

function OrderShape() {
  return (
    <View style={{
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.card,
      padding: 17,
      gap: 12,
    }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Block width="45%" height={18} />
        <Block width={88} height={23} radius={12} />
      </View>
      <Block width="72%" height={14} />
      <Block width="40%" height={12} />
      <View style={{ height: 1, backgroundColor: colors.line }} />
      <Block width="35%" height={18} />
    </View>
  );
}

export function SkeletonOrderList({ count = 3 }: { count?: number }) {
  return (
    <Pulse style={{ gap: 13 }}>
      {Array.from({ length: count }, (_, index) => <OrderShape key={index} />)}
    </Pulse>
  );
}

export function SkeletonSellerPanel() {
  return (
    <Pulse style={{ gap: 15 }}>
      <Block height={120} radius={20} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Block width="47%" height={75} radius={17} />
        <Block width="47%" height={75} radius={17} />
      </View>
      <Block width="58%" height={22} />
      <OrderShape />
      <OrderShape />
    </Pulse>
  );
}

export function SkeletonInsights() {
  return (
    <Pulse style={{ gap: 12 }}>
      <View style={{ padding: 17, gap: 12, borderRadius: 18, backgroundColor: colors.card }}>
        {Array.from({ length: 5 }, (_, index) => (
          <Block key={index} width={index % 2 ? "57%" : "82%"} height={15} />
        ))}
      </View>
      <Block height={142} radius={18} />
    </Pulse>
  );
}

export function SkeletonFairList({ count = 2 }: { count?: number }) {
  return (
    <Pulse style={{ gap: 16 }}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={{ gap: 12, padding: 16, backgroundColor: colors.card, borderRadius: 16 }}>
          <Block height={145} radius={16} />
          <Block width="78%" height={22} />
          <Block width="94%" height={12} />
          <Block width="62%" height={12} />
          <Block height={43} radius={15} />
        </View>
      ))}
    </Pulse>
  );
}

export function SkeletonReviews({ count = 2 }: { count?: number }) {
  return (
    <Pulse style={{ gap: 12 }}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={{ gap: 9, padding: 17, borderRadius: 19, backgroundColor: colors.card }}>
          <Block width="42%" height={14} />
          <Block width="95%" height={11} />
          <Block width="67%" height={11} />
        </View>
      ))}
    </Pulse>
  );
}


/** Compact rows for push preferences and the notification inbox. */
export function SkeletonTextCards({ count = 3 }: { count?: number }) {
  return (
    <Pulse style={{ gap: 12 }}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={{ padding: 16, gap: 10, backgroundColor: colors.card, borderRadius: 16 }}>
          <Block width={index % 2 ? "65%" : "82%"} height={16} />
          <Block width="94%" height={12} />
          <Block width="39%" height={11} />
        </View>
      ))}
    </Pulse>
  );
}

export function SkeletonNoticeDetail() {
  return (
    <Pulse style={{ gap: 13 }}>
      <Block width="88%" height={28} />
      <Block width="98%" height={14} />
      <Block width="92%" height={14} />
      <Block width="72%" height={14} />
      <Block width="40%" height={11} />
    </Pulse>
  );
}
