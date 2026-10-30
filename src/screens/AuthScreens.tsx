import React, { useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../auth";
import { Button, ErrorBox, Field, Screen, T } from "../ui";
import { colors } from "../theme";
import { passwordStatus } from "../domain/password-policy";
import { openWeb } from "../external";
export function Login() {
  const auth = useAuth();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (auth.googleSignup) router.replace("/cadastro");
  }, [auth.googleSignup]);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <LinearGradient
        colors={["#F96036", "#FF8550"]}
        style={{ borderRadius: 28, padding: 25, gap: 14 }}
      >
        <T heading style={{ fontSize: 29, lineHeight: 34, color: "white" }}>
          Seu condomínio mais perto de você!
        </T>
        <T style={{ color: "#FFF2EA" }}>
          Compre dos seus vizinhos. Apoie comércios locais. Receba no seu
          condomínio.
        </T>
        <Image
          source={require("../../assets/images/hero.png")}
          style={{ height: 155, width: "100%" }}
          resizeMode="contain"
        />
      </LinearGradient>
      <View>
        <T heading style={{ fontSize: 28, lineHeight: 36 }}>
          Bem-vindo(a)!
        </T>
        <T style={{ color: colors.muted }}>Acesse sua conta para continuar.</T>
      </View>
      <ErrorBox message={error || auth.connectionError} />
      <Button
        title="Entrar com Google"
        secondary
        busy={busy}
        onPress={() => void run(async () => {
          const result = await auth.google();
          if (result === "signup") router.replace("/cadastro");
        })}
      />
      <Field
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Field
        label="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
      />
      <Pressable onPress={() => router.push("/recuperar")}>
        <T style={{ textAlign: "right", fontSize: 12 }}>Esqueci minha senha</T>
      </Pressable>
      <Button
        title="Entrar com e-mail"
        busy={busy}
        disabled={!email || !password}
        onPress={() =>
          void run(() => auth.login(email.trim().toLowerCase(), password))
        }
      />
      <Button
        title="Cadastrar conta"
        secondary
        onPress={() => router.push("/cadastro")}
      />
      <LegalLinks />
    </Screen>
  );
}
function LegalLinks() {
  const { api } = useAuth();
  return (
    <T style={{ fontSize: 11, textAlign: "center", color: colors.muted }}>
      Ao continuar, consulte nossos{" "}
      <T
        style={{ fontSize: 11, textDecorationLine: "underline" }}
        onPress={() => void openWeb(api.web("/termos-de-uso"))}
      >
        Termos de uso
      </T>{" "}
      e a{" "}
      <T
        style={{ fontSize: 11, textDecorationLine: "underline" }}
        onPress={() => void openWeb(api.web("/politica-de-privacidade"))}
      >
        Política de privacidade
      </T>
      .
    </T>
  );
}
export function Register() {
  const auth = useAuth();
  const [form, setForm] = useState({
      name: auth.googleSignup?.name ?? "",
      email: auth.googleSignup?.email ?? "",
      phone: "",
      password: "",
      invite: "",
      tower: "",
      apartment: "",
    }),
    [condo, setCondo] = useState<{ name: string; towers: string[] } | null>(
      null,
    ),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  // Derive the Google identity without updating state inside an effect:
  // the signup flow may return while this screen is already mounted.
  const verifiedEmail = auth.googleSignup?.email ?? form.email;
  const suggestedName = form.name || auth.googleSignup?.name || "";
  const set = (key: keyof typeof form, value: string) =>
    setForm((v) => ({ ...v, [key]: value }));
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const policy = passwordStatus(form.password);
  return (
    <Screen title="Cadastrar conta" back>
      <T heading style={{ fontSize: 26 }}>
        Informações do morador
      </T>
      <ErrorBox message={error} />
      {message ? (
        <>
          <T>{message}</T>
          <Button
            title="Voltar para entrar"
            onPress={() => router.replace("/entrar")}
          />
        </>
      ) : (
        <>
          {!auth.googleSignup ? (
            <>
              <T style={{ color: colors.muted }}>
                Cadastre-se usando sua conta Google e complete os dados do condomínio.
              </T>
              <Button
                title="Cadastrar com Google"
                secondary
                busy={busy}
                onPress={() => void run(async () => {
                  const result = await auth.google();
                  if (result === "login") router.replace("/");
                })}
              />
              <T style={{ textAlign: "center", color: colors.muted }}>
                Ou cadastre-se com e-mail e senha
              </T>
            </>
          ) : (
            <T style={{ color: colors.green }}>
              Google confirmado: {auth.googleSignup.email}. Informe o código
              do condomínio e seus dados para concluir o cadastro.
            </T>
          )}
          <Field
            label="Código do condomínio"
            value={form.invite}
            autoCapitalize="none"
            maxLength={150}
            onChangeText={(v) => {
              set("invite", v);
              setCondo(null);
              set("tower", "");
            }}
          />
          <Button
            title="Verificar condomínio"
            busy={busy}
            secondary
            onPress={() =>
              void run(async () =>
                setCondo(
                  await auth.api.request(
                    "public/condominium",
                    "POST",
                    { invite: form.invite },
                    true,
                  ),
                ),
              )
            }
          />
          {condo && (
            <T bold style={{ color: colors.green }}>
              {condo.name}
            </T>
          )}
          <Field
            label="Nome"
            value={suggestedName}
            onChangeText={(v) => set("name", v)}
            maxLength={90}
            autoComplete="name"
          />
          <Field
            label="E-mail"
            value={verifiedEmail}
            editable={!auth.googleSignup}
            onChangeText={(v) => set("email", v)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Field
            label="WhatsApp com DDD"
            value={form.phone}
            onChangeText={(v) => set("phone", v)}
            keyboardType="phone-pad"
            maxLength={20}
          />
          <T bold>Torre</T>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {condo?.towers.map((t) => (
              <Pressable
                key={t}
                accessibilityRole="radio"
                accessibilityState={{ selected: form.tower === t }}
                onPress={() => set("tower", t)}
                style={{
                  padding: 10,
                  borderRadius: 99,
                  backgroundColor: form.tower === t ? colors.yellow : "white",
                }}
              >
                <T>{t}</T>
              </Pressable>
            ))}
          </View>
          <Field
            label="Apartamento"
            value={form.apartment}
            onChangeText={(v) => set("apartment", v)}
            maxLength={24}
          />
          {!auth.googleSignup && (
            <>
              <Field
                label="Senha"
                value={form.password}
                onChangeText={(v) => set("password", v)}
                secureTextEntry
                maxLength={100}
                autoComplete="new-password"
              />
              <View>
                {policy.requirements.map((r) => (
                  <T
                    key={r.id}
                    style={{
                      fontSize: 12,
                      color: r.met ? colors.green : colors.muted,
                    }}
                  >
                    {r.met ? "✓" : "○"} {r.label}
                  </T>
                ))}
              </View>
            </>
          )}
          <Button
            title="Criar minha conta"
            busy={busy}
            disabled={
              !condo || !form.tower || (!auth.googleSignup && !policy.valid)
            }
            onPress={() =>
              void run(async () => {
                if (auth.googleSignup) {
                  await auth.finishSignup({
                    ...form, email: verifiedEmail, name: suggestedName,
                  });
                  return;
                }
                const r = await auth.api.request<{ message: string }>(
                  "auth/register",
                  "POST",
                  { ...form, email: form.email.trim().toLowerCase() },
                  true,
                );
                setMessage(r.message);
              })
            }
          />
          <LegalLinks />
        </>
      )}
    </Screen>
  );
}
export function Recover() {
  const { api } = useAuth();
  const [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  return (
    <Screen title="Recuperar senha" back>
      <T heading style={{ fontSize: 26 }}>
        Recuperar senha
      </T>
      <T>Informe seu e-mail para receber o link de recuperação.</T>
      <ErrorBox message={error} />
      {sent ? (
        <T>
          Se este e-mail estiver cadastrado, você receberá as instruções.
          Conclua a redefinição pelo link seguro e volte ao aplicativo para
          entrar.
        </T>
      ) : (
        <>
          <Field
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button
            title="Enviar link de recuperação"
            busy={busy}
            onPress={() => {
              setBusy(true);
              setError("");
              api
                .request(
                  "auth/password/request",
                  "POST",
                  { email: email.trim().toLowerCase() },
                  true,
                )
                .then(() => setSent(true))
                .catch((e) => setError(e.message))
                .finally(() => setBusy(false));
            }}
          />
        </>
      )}
    </Screen>
  );
}
// The OAuth callback is consumed once per mounted return screen.
export function GoogleCallback() {
  const auth = useAuth();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
  }>();
  const [error, setError] = useState("");
  useEffect(() => {
    const u = new URL("condovery://auth/callback");
    for (const [k, v] of Object.entries(params))
      if (typeof v === "string") u.searchParams.set(k, v);
    void auth
      .completeGoogle(u.toString())
      .then((result) => router.replace(result === "signup" ? "/cadastro" : "/"))
      .catch((e) => setError(e.message)); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Screen title="Entrando">
      <T>Concluindo seu acesso…</T>
      <ErrorBox message={error} />
      {error && (
        <Button
          title="Voltar para entrar"
          onPress={() => router.replace("/entrar")}
        />
      )}
    </Screen>
  );
}
