import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { ApiClient, backendOrigin } from "./api";
import { secure } from "./storage";
import type { Viewer } from "./types";
type Signup = { signup_token: string; email: string; name: string };
type Auth = {
  api: ApiClient;
  viewer: Viewer | null;
  loading: boolean;
  connectionError: string;
  googleSignup: Signup | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  google: () => Promise<void>;
  completeGoogle: (url: string) => Promise<void>;
  finishSignup: (values: Record<string, string>) => Promise<void>;
};
const Context = createContext<Auth | null>(null);
WebBrowser.maybeCompleteAuthSession();
let origin = "";
try {
  origin = backendOrigin(process.env.EXPO_PUBLIC_API_URL ?? "", __DEV__);
} catch {}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null),
    [viewer, setViewer] = useState<Viewer | null>(null),
    [loading, setLoading] = useState(true),
    [connectionError, setConnectionError] = useState(""),
    [googleSignup, setGoogleSignup] = useState<Signup | null>(null);
  const exchange = useRef<Promise<void> | null>(null);
  const clear = useCallback(async () => {
    setToken(null);
    setViewer(null);
    setGoogleSignup(null);
    await secure.remove("session");
  }, []);
  const api = useMemo(() => new ApiClient(origin, token), [token]);
  useEffect(() => {
    api.setExpirationHandler(() => {
      void clear();
    });
    return () => api.setExpirationHandler(() => {});
  }, [api, clear]);
  const accept = async (t: string) => {
    if (!/^[a-f0-9]{64}$/.test(t))
      throw new Error("Resposta de sessão inválida.");
    const client = new ApiClient(origin, t);
    const r = await client.request<{ viewer: Viewer | null }>("me");
    if (!r.viewer || r.viewer.status !== "approved") {
      await secure.remove("session");
      throw new Error("Conta indisponível.");
    }
    await secure.set("session", t);
    setToken(t);
    setViewer(r.viewer);
    setConnectionError("");
    setGoogleSignup(null);
  };
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const t = await secure.get("session");
        if (!active) return;
        if (t) await accept(t);
      } catch (e) {
        if (active)
          setConnectionError(
            e instanceof Error ? e.message : "Não foi possível conectar.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const refresh = async () => {
    const r = await api.request<{ viewer: Viewer | null }>("me");
    if (!r.viewer || r.viewer.status !== "approved") {
      await clear();
      return;
    }
    setViewer(r.viewer);
  };
  const completeGoogle = async (url: string) => {
    if (exchange.current) return exchange.current;
    const work = async () => {
      const u = new URL(url);
      if (
        u.protocol !== "condovery:" ||
        u.hostname !== "auth" ||
        u.pathname !== "/callback"
      )
        throw new Error("Retorno inválido.");
      const saved = await secure.get("oauth");
      if (!saved) throw new Error("Acesso expirado. Entre novamente.");
      const flow = JSON.parse(saved) as {
        verifier: string;
        state: string;
        expires: number;
      };
      if (
        flow.expires < Date.now() ||
        u.searchParams.get("state") !== flow.state
      )
        throw new Error("Acesso expirado. Entre novamente.");
      await secure.remove("oauth");
      if (u.searchParams.get("error"))
        throw new Error("Não foi possível concluir o acesso Google.");
      const r = await api.request<
        { access_token?: string; registration_required?: boolean } & Signup
      >(
        "mobile/auth/google/exchange",
        "POST",
        {
          code: u.searchParams.get("code"),
          verifier: flow.verifier,
          state: flow.state,
        },
        true,
      );
      if (r.registration_required) setGoogleSignup(r);
      else if (r.access_token) await accept(r.access_token);
      else throw new Error("Resposta de acesso inválida.");
    };
    exchange.current = work().finally(() => {
      exchange.current = null;
    });
    return exchange.current;
  };
  return (
    <Context.Provider
      value={{
        api,
        viewer,
        loading,
        connectionError,
        googleSignup,
        refresh,
        completeGoogle,
        login: async (email, password) => {
          const r = await api.request<{ access_token: string }>(
            "mobile/auth/login",
            "POST",
            { email, password },
            true,
          );
          await accept(r.access_token);
        },
        logout: async () => {
          try {
            if (Constants.executionEnvironment !== "storeClient") {
              const Notifications = await import("expo-notifications");
              await Promise.allSettled([
                Notifications.unregisterForNotificationsAsync(),
                Notifications.dismissAllNotificationsAsync(),
              ]);
            }
          } catch {
            /* Local OS deregistration is best effort; server revocation is independent. */
          }
          try {
            await api.request("auth/logout", "POST");
          } finally {
            await clear();
          }
        },
        finishSignup: async (values) => {
          const r = await api.request<{ access_token: string }>(
            "mobile/auth/register-google",
            "POST",
            { ...values, signup_token: googleSignup?.signup_token },
            true,
          );
          await accept(r.access_token);
        },
        google: async () => {
          if (Constants.executionEnvironment === "storeClient")
            throw new Error(
              "Use a build de desenvolvimento do Condovery para entrar com Google.",
            );
          const hex = async () =>
            Array.from(await Crypto.getRandomBytesAsync(32), (b) =>
              b.toString(16).padStart(2, "0"),
            ).join("");
          const verifier = await hex(),
            state = await hex();
          const challenge = String(
            await Crypto.digestStringAsync(
              Crypto.CryptoDigestAlgorithm.SHA256,
              verifier,
              { encoding: Crypto.CryptoEncoding.BASE64 },
            ),
          )
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
          await secure.set(
            "oauth",
            JSON.stringify({ verifier, state, expires: Date.now() + 600000 }),
          );
          const r = await api.request<{ url: string }>(
            "mobile/auth/google/start",
            "POST",
            { challenge, state },
            true,
          );
          const result = await WebBrowser.openAuthSessionAsync(
            r.url,
            "condovery://auth/callback",
          );
          if (result.type === "success") await completeGoogle(result.url);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const c = useContext(Context);
  if (!c) throw new Error("AuthProvider ausente");
  return c;
}
