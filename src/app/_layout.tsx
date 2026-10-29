import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Platform, View } from "react-native";
import { Stack, router } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { useURL } from "expo-linking";
import { Outfit_700Bold, Outfit_800ExtraBold } from "@expo-google-fonts/outfit";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { AuthProvider, useAuth } from "../auth";
import { MarketProvider } from "../market";
import { usePush } from "../push";
import { colors } from "../theme";
export default function Root() {
  const [loaded, error] = useFonts({
    Outfit_700Bold,
    Outfit_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {loaded || error ? (
        <AuthProvider>
          <SessionShell />
        </AuthProvider>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.bg,
          }}
        >
          <ActivityIndicator color={colors.orange} />
        </View>
      )}
    </SafeAreaProvider>
  );
}
function SessionShell() {
  const { viewer } = useAuth();
  return (
    <ResourceSession
      key={viewer ? viewer.id + "." + viewer.condominium_id : "anonymous"}
    />
  );
}
function ResourceSession() {
  const [client] = useState(() => new QueryClient());
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (Platform.OS !== "web") focusManager.setFocused(state === "active");
    });
    return () => {
      sub.remove();
      client.clear();
    };
  }, [client]);
  return (
    <QueryClientProvider client={client}>
      <MarketProvider>
        <Navigator />
      </MarketProvider>
    </QueryClientProvider>
  );
}
function Navigator() {
  const { viewer, loading } = useAuth();
  usePush();
  const incoming = useURL();
  const shop = useRef<string | null>(null);
  useEffect(() => {
    if (!incoming) return;
    try {
      const u = new URL(incoming);
      if (
        u.protocol === "condovery:" &&
        u.hostname === "loja" &&
        /^\/[a-z0-9-]+$/.test(u.pathname)
      )
        shop.current = u.pathname.slice(1);
    } catch {}
  }, [incoming]);
  useEffect(() => {
    if (viewer && shop.current) {
      const id = shop.current;
      shop.current = null;
      router.push({ pathname: "/loja/[id]", params: { id } });
    }
  }, [viewer, incoming]);
  if (loading)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!viewer}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!viewer}>
        <Stack.Screen name="(shopper)" />
      </Stack.Protected>
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}
