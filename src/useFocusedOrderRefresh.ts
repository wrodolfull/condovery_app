import { useCallback, useRef } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";

/** Refresh only while this screen is focused and the app is in foreground.
 * Store the latest callback in a ref so query updates do not restart polling.
 */
export function useFocusedOrderRefresh(
  reload: () => Promise<unknown>, key: string, poll = true,
): void {
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  useFocusEffect(useCallback(() => {
    let active = true;
    let fetching = false;
    let lastRequest = 0;
    const refresh = (force = false) => {
      if (!active || fetching || AppState.currentState !== "active") return;
      if (!force && Date.now() - lastRequest < 4000) return;
      fetching = true;
      lastRequest = Date.now();
      void reloadRef.current().catch(() => {
        // The screen renders the query's own error and retry action.
      }).finally(() => { fetching = false; });
    };
    refresh(true);
    const timer = poll ? setInterval(() => refresh(true), 20000) : undefined;
    const listener = AppState.addEventListener("change",state => {
      if (state === "active") refresh();
    });
    return () => {
      active = false;
      if (timer) clearInterval(timer);
      listener.remove();
    };
  }, [key,poll]));
}

export function orderNeedsLiveRefresh(status: string | undefined): boolean {
  return !status || status === "awaiting_confirmation" || status === "confirmed";
}
