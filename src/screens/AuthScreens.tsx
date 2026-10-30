import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../auth";
import { Button, ErrorBox, Field, Screen, T } from "../ui";
import { colors } from "../theme";
import { passwordStatus } from "../domain/password-policy";
import { openWeb } from "../external";
import {
  AuthDivider,
  AuthIntro,
  AuthPrivacy,
  AuthSwitch,
  GoogleButton,
  WelcomeMark,
} from "../components/AuthVisuals";

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
    <Screen title="Entrar">
      <AuthIntro />
      <View style={{ gap: 7 }}>
        <WelcomeMark />
        <T heading style={{ fontSize: 28, lineHeight: 34, letterSpacing: -0.75 }}>
          Bem-vindo(a)!
        </T>
        <T style={{ color: colors.muted, fontSize: 13 }}>
          Acesse sua conta para continuar.
        </T>
      </View>
      <ErrorBox message={error || auth.connectionError} />
      <View style={{ gap: 15 }}>
        <Field
          label="E-mail"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          label="Senha"
          placeholder="Sua senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/recuperar")}
          style={{ alignSelf: "flex-end", paddingVertical: 5 }}
        >
          <T bold style={{ color: "#A9502D", fontSize: 12 }}>
            Esqueci minha senha
          </T>
        </Pressable>
        <Button
          title="Entrar com e-mail"
          busy={busy}
          disabled={!email.trim() || !password}
          onPress={() =>
            void run(() => auth.login(email.trim().toLowerCase(), password))
          }
        />
      </View>
      <AuthDivider />
      <GoogleButton
        busy={busy}
        onPress={() => void run(async () => {
          const result = await auth.google();
          if (result === "signup") router.replace("/cadastro");
        })}
      />
      <AuthSwitch
        question="Ainda não tem cadastro?"
        action="Cadastre-se"
        onPress={() => router.push("/cadastro")}
      />
      <AuthPrivacy />
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
  // Google can return while the registration screen is already mounted.
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
      <AuthIntro compact />
      <View style={{ gap: 7 }}>
        <WelcomeMark />
        <T heading style={{ fontSize: 27, lineHeight: 34, letterSpacing: -0.75 }}>
          {auth.googleSignup ? "Informações do morador" : "Cadastrar conta"}
        </T>
        <T style={{ color: colors.muted, fontSize: 13 }}>
          {auth.googleSignup
            ? "Seu e-mail já está confirmado. Informe os dados do condomínio para entrar."
            : "Crie sua conta e descubra o que seus vizinhos oferecem."}
        </T>
      </View>
      <ErrorBox message={error} />
      {message ? (
        <View style={{ gap: 15 }}>
          <T style={{ color: colors.green }}>{message}</T>
          <Button
            title="Voltar para entrar"
            onPress={() => router.replace("/entrar")}
          />
        </View>
      ) : (
        <>
          {auth.googleSignup && (
            <View style={{ gap: 12 }}>
              <T style={{ color: colors.green }}>
                Google confirmado: {auth.googleSignup.email}. Complete os dados
                do condomínio para concluir seu cadastro.
              </T>
              <Button
                title="Usar outra conta"
                secondary
                busy={busy}
                onPress={() => {
                  auth.cancelGoogleSignup();
                  setForm((current) => ({
                    ...current, name: "", email: "", password: "",
                  }));
                  setError("");
                }}
              />
            </View>
          )}
          <View style={{ gap: 15 }}>
            <Field
              label="Nome completo"
              placeholder="Como podemos chamar você?"
              value={suggestedName}
              onChangeText={(v) => set("name", v)}
              maxLength={90}
              autoComplete="name"
            />
            <Field
              label="WhatsApp"
              placeholder="(11) 99999-9999"
              value={form.phone}
              onChangeText={(v) => set("phone", v)}
              keyboardType="phone-pad"
              maxLength={20}
            />
            <Field
              label="Código de convite"
              placeholder="Código fornecido pelo condomínio"
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
              disabled={!form.invite.trim()}
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
              <View style={{
                backgroundColor: "#EAF7EF",
                borderRadius: 12,
                padding: 12,
              }}>
                <T bold style={{ color: colors.green }}>
                  {condo.name}
                </T>
              </View>
            )}
            <View style={{ gap: 8 }}>
              <T bold style={{ fontSize: 12 }}>Torre</T>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {condo?.towers.map((t) => (
                  <Pressable
                    key={t}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: form.tower === t }}
                    onPress={() => set("tower", t)}
                    style={{
                      paddingHorizontal: 15,
                      paddingVertical: 11,
                      borderRadius: 99,
                      borderWidth: 1,
                      borderColor: form.tower === t ? "#D8B32A" : colors.line,
                      backgroundColor: form.tower === t ? colors.yellow : "#FFFFFF",
                    }}
                  >
                    <T bold style={{ fontSize: 12 }}>{t}</T>
                  </Pressable>
                ))}
              </View>
              {!condo && (
                <T style={{ color: colors.muted, fontSize: 11 }}>
                  Verifique o código de convite para selecionar a torre.
                </T>
              )}
            </View>
            <Field
              label="Apartamento"
              placeholder="Ex.: 83"
              value={form.apartment}
              onChangeText={(v) => set("apartment", v)}
              maxLength={24}
            />
            <T style={{ color: colors.muted, fontSize: 11 }}>
              Com o código do condomínio, você entra sem aguardar aprovação.
            </T>
            <Field
              label="E-mail"
              placeholder="seuemail@exemplo.com"
              value={verifiedEmail}
              editable={!auth.googleSignup}
              onChangeText={(v) => set("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {!auth.googleSignup && (
              <>
                <Field
                  label="Senha"
                  placeholder="Mínimo de 8 caracteres"
                  value={form.password}
                  onChangeText={(v) => set("password", v)}
                  secureTextEntry
                  maxLength={100}
                  autoComplete="new-password"
                />
                <View style={{ gap: 2 }}>
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
                !condo || !form.tower ||
                !suggestedName.trim() || !verifiedEmail.trim() ||
                !form.phone.trim() || !form.apartment.trim() ||
                (!auth.googleSignup && !policy.valid)
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
          </View>
          {!auth.googleSignup && (
            <>
              <AuthDivider />
              <GoogleButton
                busy={busy}
                onPress={() => void run(async () => {
                  const result = await auth.google();
                  if (result === "login") router.replace("/");
                })}
              />
            </>
          )}
          <AuthSwitch
            question="Já possui uma conta?"
            action="Faça login"
            onPress={() => router.replace("/entrar")}
          />
          <LegalLinks />
          <AuthPrivacy />
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
