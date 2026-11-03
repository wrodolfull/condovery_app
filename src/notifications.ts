import { useCallback } from "react";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth";
import type { Notice } from "./types";
import { notificationDestination } from "./domain/notification-navigation";

export function useOpenNotification() {
  const {api} = useAuth();
  const client = useQueryClient();
  return useCallback(async (source: Notice | string) => {
    // The GET validates user + condominium for notification taps originating
    // from the Android system tray. Do not trust metadata from a push payload.
    const notice = typeof source === "string"
      ? (await api.request<{notification: Notice}>("push/inbox/" + source)).notification
      : source;
    await api.request("push/inbox/" + notice.id, "PATCH").catch(() => {});
    void client.invalidateQueries({queryKey:["push/summary"]});
    void client.invalidateQueries({predicate:q=>
      typeof q.queryKey[2] === "string" && q.queryKey[2].startsWith("push/inbox")
    });
    const destination = notificationDestination(notice);
    switch (destination.screen) {
      case "seller":
        router.push({pathname:"/vendedor",params:{
          tab:destination.tab,
          ...(destination.orderId?{order_id:destination.orderId}:{}),
          ...(destination.reviewId?{review_id:destination.reviewId}:{})
        }});
        return;
      case "explore":
        router.push("/explorar");
        return;
      case "buyer-order":
        router.push({pathname:"/pedido/[id]",params:{id:destination.orderId}});
        return;
      case "shop":
        router.push({pathname:"/loja/[id]",params:{id:destination.shopId}});
        return;
      default:
        router.push({pathname:"/aviso/[id]",params:{id:notice.id}});
    }
  },[api,client]);
}
