import React from "react";
import { ActivityIndicator, Image, Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ShieldCheck, ShoppingBag } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { T } from "../ui";
import { colors } from "../theme";

/** Auth presentation shared by login and registration; mirrors the web mobile design. */
export function AuthIntro({ compact = false }: { compact?: boolean }) {
  return (
    <LinearGradient
      colors={["#F84927", "#FF6E3F", "#FF965D"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        minHeight: compact ? 148 : 174,
        borderRadius: 26,
        overflow: "hidden",
        justifyContent: "center",
        paddingVertical: 20,
        paddingLeft: 20,
        paddingRight: 12,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          width: 155,
          height: 155,
          borderRadius: 80,
          backgroundColor: "rgba(255,255,255,.10)",
          position: "absolute",
          top: -38,
          right: -42,
        }}
      />
      <View style={{ maxWidth: "65%", gap: 9, zIndex: 1 }}>
        <T
          bold
          style={{
            color: "#FFF4D8",
            fontSize: 9,
            lineHeight: 13,
            letterSpacing: 0.7,
          }}
        >
          ELEVADOOR · TUDO DE BOM MORA AQUI
        </T>
        <T
          heading
          style={{
            color: "#FFFFFF",
            fontSize: compact ? 19 : 22,
            lineHeight: compact ? 23 : 26,
            letterSpacing: -0.35,
          }}
        >
          Seu condomínio mais perto de você!
        </T>
        <T style={{ color: "#FFF7EC", fontSize: 11, lineHeight: 16 }}>
          Compre dos seus vizinhos, apoie comércios locais e receba no condomínio.
        </T>
      </View>
      <Image
        source={require("../../assets/images/hero.png")}
        accessibilityLabel="Ilustração de boas-vindas do Elevadoor"
        resizeMode="contain"
        style={{
          width: compact ? 148 : 165,
          height: compact ? 140 : 162,
          position: "absolute",
          right: -23,
          bottom: -8,
        }}
      />
    </LinearGradient>
  );
}

export function WelcomeMark() {
  return (
    <View
      style={{
        width: 51,
        height: 51,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF0E3",
      }}
    >
      <ShoppingBag size={25} strokeWidth={1.9} color="#F3653D" />
    </View>
  );
}

function GoogleIcon() {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.4h6c-.3 1.4-1.1 2.5-2.4 3.2v2.7h3.9c2.2-2.1 3.1-4.8 3.1-8Z" />
      <Path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.9-2.7c-1.1.7-2.3 1.1-3.5 1.1-2.7 0-5-1.8-5.8-4.3h-4V17c1.8 3.6 5.5 6 9.8 6Z" />
      <Path fill="#FBBC05" d="M6.2 14.4a6.8 6.8 0 0 1 0-4.7V7h-4C1.4 8.6 1 10.3 1 12s.4 3.4 1.2 5l4-2.6Z" />
      <Path fill="#EA4335" d="M12 5.3c1.7 0 3.2.6 4.4 1.7l3.4-3.4C17.8 1.8 15.2 1 12 1 7.7 1 4 3.4 2.2 7l4 2.7c.8-2.6 3.1-4.4 5.8-4.4Z" />
    </Svg>
  );
}

export function AuthDivider() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: "#E7E3DB" }} />
      <T style={{ color: "#858079", fontSize: 12 }}>ou continue com</T>
      <View style={{ flex: 1, height: 1, backgroundColor: "#E7E3DB" }} />
    </View>
  );
}

export function GoogleButton({
  onPress,
  busy = false,
}: {
  onPress: () => void;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continuar com Google"
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={{
        minHeight: 52,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#DDDCD4",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 17,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        opacity: busy ? 0.55 : 1,
      }}
    >
      {busy ? <ActivityIndicator color={colors.ink} /> : <GoogleIcon />}
      <T bold style={{ color: "#27251F", fontSize: 14 }}>
        Continuar com Google
      </T>
    </Pressable>
  );
}

export function AuthSwitch({
  question,
  action,
  onPress,
}: {
  question: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
      }}
    >
      <T style={{ color: colors.muted, fontSize: 13 }}>{question}</T>
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
        <T bold style={{ color: "#E45D36", fontSize: 13 }}>{action}</T>
      </Pressable>
    </View>
  );
}

export function AuthPrivacy() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <ShieldCheck size={14} color="#7A756C" />
      <T style={{ color: "#7A756C", fontSize: 11 }}>
        Exclusivo para moradores autorizados.
      </T>
    </View>
  );
}
