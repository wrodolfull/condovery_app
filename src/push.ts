import type { NotificationResponse } from "expo-notifications";
import { useCallback, useEffect } from "react";
import { AppState, Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { useAuth } from "./auth";
import { secure } from "./storage";
const compatible = () =>
  Platform.OS !== "web" &&
  Constants.executionEnvironment !== "storeClient" &&
  Device.isDevice;
const idValid = (id: unknown): id is string =>
  typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id);
export function usePush(listen = true) {
  const { viewer, api } = useAuth();
  const register = useCallback(
    async (ask = false) => {
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
      if (!permission.granted && ask)
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
    },
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
        const sub = N.addNotificationResponseReceivedListener(handle);
        cleanup.push(() => sub.remove());
        const rotated = N.addPushTokenListener(() => {
          void register().catch(() => {});
        });
        cleanup.push(() => rotated.remove());
        handle(N.getLastNotificationResponse());
        await N.clearLastNotificationResponseAsync();
        await register();
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
  }, [viewer, api, register, listen]);
  return { activate: () => register(true) };
}
