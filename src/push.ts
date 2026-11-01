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
import { shouldAutoRequestPushPermission } from "./domain/push-permission";
// AuthProvider creates a new API client for every new login session.
const registrationGates = new WeakMap<object, PushRegistrationGate>();
const AUTO_PERMISSION_PROMPT_KEY = "push_permission_prompted_v1";
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
  const queryClient=useQueryClient();
  const refreshInbox=useCallback(()=>{
    void queryClient.invalidateQueries({queryKey:["push/summary"]});
    void queryClient.invalidateQueries({predicate:q=>typeof q.queryKey[2]==="string"&&q.queryKey[2].startsWith("push/inbox")});
  },[queryClient]);
  const register = useCallback(
    (ask = false) => gateFor(api).run(async () => {
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
      let permission = await Notifications.getPermissionsAsync();
      // The normal registration path never showed Android's runtime permission
      // dialog. Trigger it once after login, with a channel already created.
      const autoRequest =
        !ask &&
        shouldAutoRequestPushPermission(
          Platform.OS,
          permission,
          (await secure.get(AUTO_PERMISSION_PROMPT_KEY)) === "1",
        );
      if (autoRequest) {
        // Remember the attempt before the system dialog to avoid repeated
        // prompts if the process is recreated during the permission flow.
        await secure.set(AUTO_PERMISSION_PROMPT_KEY, "1");
      }
      if (!permission.granted && permission.canAskAgain && (ask || autoRequest))
        permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        await api.request("push/devices", "DELETE");
        if (ask)
          throw new Error(
            "Permita as notificações nas configurações do aparelho.",
          );
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
            router.push({ pathname: "/aviso/[id]", params: { id } });
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
  }, [viewer, api, register, listen, refreshInbox]);
  return {
    activate: async () => {
      await register(true);
      // A manual button press should never report success if an automatic
      // registration was still in progress and the permission was declined.
      if (compatible()) {
        const N = await import("expo-notifications");
        if (!(await N.getPermissionsAsync()).granted)
          throw new Error("Permita as notificações nas configurações do aparelho.");
      }
    },
  };
}
