import type { NotificationResponse } from "expo-notifications";
import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { useAuth } from "./auth";
import { secure } from "./storage";
import { PushRegistrationGate } from "./domain/push-registration";
import { useOpenNotification } from "./notifications";
// AuthProvider creates a new API client for every new login session.
const PUSH_OPT_OUT_KEY = "push_device_opt_out_v1";
const registrationGates = new WeakMap<object, PushRegistrationGate>();
function gateFor(api: object) {
  let gate = registrationGates.get(api);
  if (!gate) { gate = new PushRegistrationGate(); registrationGates.set(api, gate); }
  return gate;
}
const compatible = () =>
  Platform.OS !== "web" &&
  Constants.executionEnvironment !== "storeClient" &&
  Device.isDevice;
const idValid = (id: unknown): id is string =>
  typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id);
export function usePush(listen = true) {
  const { viewer, api } = useAuth();
  const openNotification = useOpenNotification();
  const queryClient=useQueryClient();
  const refreshInbox=useCallback(()=>{
    void queryClient.invalidateQueries({predicate:q=>typeof q.queryKey[2]==="string"&&q.queryKey[2].startsWith("push/summary")});
    void queryClient.invalidateQueries({predicate:q=>typeof q.queryKey[2]==="string"&&q.queryKey[2].startsWith("push/inbox")});
  },[queryClient]);
  const register = useCallback(
    (ask = false) => gateFor(api).run(async () => {
      if (!ask && await secure.get(PUSH_OPT_OUT_KEY) === "1") return;
      if (!compatible()) {
        if (ask)
          throw new Error(
            "Notificações push precisam da build do Elevadoor em um aparelho físico.",
          );
        return;
      }
      const Notifications = await import("expo-notifications");
      if (Platform.OS === "android")
        for (const [id, name] of [
          ["pedidos", "Pedidos"],
          ["avisos", "Avisos do condomínio"],
        ])
          await Notifications.setNotificationChannelAsync(id, {
            name,
            importance: Notifications.AndroidImportance.HIGH,
          });
      const permission = await Notifications.getPermissionsAsync();
      // Passive registrations must never consume the Android permission dialog.
      // First-use onboarding provides an explicit, user-visible activation CTA.
      if (!permission.granted) {
        await api.request("push/devices", "DELETE");
        if (ask)
          throw new Error("Permita as notificações nas configurações do aparelho.");
        return;
      }
      const projectId =
        Constants.easConfig?.projectId ??
        Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        if (ask)
          throw new Error(
            "As notificações ainda não foram configuradas para esta versão.",
          );
        return;
      }
      const pushToken = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;
      let installation = await secure.get("installation");
      if (!installation) {
        installation = randomUUID();
        await secure.set("installation", installation);
      }
      await api.request("push/devices", "POST", {
        installation_id: installation,
        expo_token: pushToken,
        platform: Platform.OS,
        project_id: projectId,
      });
    }, ask),
    [api],
  );
  useEffect(() => {
    if (!listen || !viewer || !compatible()) return;
    let alive = true;
    const cleanup: (() => void)[] = [];
    void import("expo-notifications")
      .then(async (N) => {
        if (!alive) return;
        N.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        const handle = (response: NotificationResponse | null) => {
          if (!alive || !response) return;
          const id =
            response.notification.request.content.data?.notification_id;
          if (idValid(id))
            void openNotification(id).catch(() => {
              // If a stale push belongs to an old login, don't open foreign data.
              if (alive) router.navigate("/notificacoes");
            });
        };
        const sub = N.addNotificationResponseReceivedListener((response)=>{
          refreshInbox();
          handle(response);
        });
        cleanup.push(() => sub.remove());
        const foregroundPush=N.addNotificationReceivedListener(()=>refreshInbox());
        cleanup.push(()=>foregroundPush.remove());
        const rotated = N.addPushTokenListener(() => {
          // Native token changes may fire repeatedly while Expo refreshes its token.
          // Use the same coalescing/cooldown as foreground registration.
          void register().catch(() => {});
        });
        cleanup.push(() => rotated.remove());
        handle(N.getLastNotificationResponse());
        // A stale response must not block permission onboarding.
        await N.clearLastNotificationResponseAsync().catch(() => {});
        // Any authenticated registration may perform first-use onboarding.
        // The SecureStore flag and session gate prevent repeated dialogs.
        if (alive) await register();
      })
      .catch(() => {});
    const foreground = AppState.addEventListener("change", (state) => {
      if (state === "active") void register().catch(() => {});
    });
    return () => {
      alive = false;
      foreground.remove();
      cleanup.forEach((fn) => fn());
    };
  }, [viewer, api, register, listen, refreshInbox, openNotification]);
  return {
    activate: async () => {
      if (!compatible())
        throw new Error("Notificações precisam do APK Elevadoor instalado em um aparelho físico.");
      const N = await import("expo-notifications");
      if (Platform.OS === "android") {
        for (const [id,name] of [["pedidos","Pedidos"],["avisos","Avisos do condomínio"]])
          await N.setNotificationChannelAsync(id,{name,importance:N.AndroidImportance.HIGH});
      }
      let permission = await N.getPermissionsAsync();
      if (!permission.granted && permission.canAskAgain)
        permission = await N.requestPermissionsAsync();
      if (!permission.granted)
        throw new Error("Notificações desativadas. Ative a permissão nas configurações do aparelho.");
      const wasDisabled = await secure.get(PUSH_OPT_OUT_KEY) === "1";
      await secure.remove(PUSH_OPT_OUT_KEY);
      try {
        await register(true);
        const status = await api.request<{registered_devices:number}>("push/status");
        if (status.registered_devices < 1)
          throw new Error("Permissão concedida, mas o dispositivo não foi registrado para receber avisos.");
      } catch (error) {
        if (wasDisabled) {
          await secure.set(PUSH_OPT_OUT_KEY,"1");
          await gateFor(api).run(()=>api.request("push/devices","DELETE").then(()=>{}),true).catch(()=>{});
        }
        throw error;
      }
    },
    deactivate: async () => {
      // Persist opt-out before waiting for in-flight auto registrations.
      // Explicit unregistration wins against the foreground listener.
      await secure.set(PUSH_OPT_OUT_KEY,"1");
      try {
        await gateFor(api).run(async () => {
          await api.request("push/devices","DELETE");
        },true);
        refreshInbox();
      } catch (error) {
        await secure.remove(PUSH_OPT_OUT_KEY).catch(()=>{});
        throw error;
      }
    },
  };
}
