import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Switch, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Bell, ChevronRight, CircleHelp, Gift, LogOut, Receipt,
  Settings, ShieldCheck, Store, Trash2,
} from "lucide-react-native";
import { useAuth } from "../auth";
import { useResource } from "../hooks";
import { usePush } from "../push";
import {
  Button,
  Card,
  Empty,
  ErrorBox,
  Field,
  Loading,
  Picture,
  Screen,
  T,
  alertError,
} from "../ui";
import { colors } from "../theme";
import { openWeb } from "../external";
import { uploadPicture } from "../upload";
import type { Notice } from "../types";
import { helpArticles } from "../domain/help-content";
type AccountLink = {
  label: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
};
export function Account() {
  const auth = useAuth();
  const viewer = auth.viewer;
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const webPanel = () => router.push("/vendedor");
  const logout = () => setLogoutOpen(true);
  const confirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await auth.logout();
      setLogoutOpen(false);
    } catch (e) {
      alertError(e);
    } finally {
      setLoggingOut(false);
    }
  };
  const shortcuts: AccountLink[] = [
    {
      label: "Feiras do condomínio",
      description: "Descubra as feiras da vizinhança",
      icon: <Gift size={22} color={colors.ink} />,
      onPress: () => router.push("/feiras"),
    },
    {
      label: "Minha loja / Quero vender",
      description: "Gerencie sua loja e seus pedidos no aplicativo",
      icon: <Store size={22} color={colors.ink} />,
      onPress: webPanel,
    },
    {
      label: "Meus pedidos",
      description: "Acompanhe suas compras",
      icon: <Receipt size={22} color={colors.ink} />,
      onPress: () => router.push("/pedidos"),
    },
    {
      label: "Notificações",
      description: "Avisos de lojas e do condomínio",
      icon: <Bell size={22} color={colors.ink} />,
      onPress: () => router.push("/notificacoes"),
    },
    {
      label: "Preferências de notificações",
      description: "Escolha os avisos que deseja receber",
      icon: <Settings size={22} color={colors.ink} />,
      onPress: () => router.push("/preferencias"),
    },
    {
      label: "Central de ajuda",
      description: "Tire dúvidas sobre compras e feiras",
      icon: <CircleHelp size={22} color={colors.ink} />,
      onPress: () => router.push("/ajuda"),
    },
  ];
  if (viewer?.role === "admin")
    shortcuts.push({
      label: "Administração",
      description: "Acesse o painel administrativo na web",
      icon: <ShieldCheck size={22} color={colors.ink} />,
      onPress: () => void openWeb(auth.api.web("/")).catch(alertError),
    });
  shortcuts.push({
    label: "Sair",
    description: "Encerrar sessão neste dispositivo",
    icon: <LogOut size={22} color={colors.ink} />,
    onPress: logout,
  });
  if (viewer?.role === "resident")
    shortcuts.push({
      label: "Excluir minha conta",
      description: "Encerrar definitivamente seu acesso",
      icon: <Trash2 size={22} color="#BA4538" />,
      onPress: () => router.push("/excluir-conta"),
    });
  return (
    <>
      <Modal
        visible={logoutOpen}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!loggingOut) setLogoutOpen(false); }}
        statusBarTranslucent
      >
        <View style={{
          flex: 1, backgroundColor: "rgba(29,26,22,0.57)",
          justifyContent: "center", paddingHorizontal: 24,
        }}>
          <View style={{
            backgroundColor: "#FFFCF8", borderRadius: 26,
            padding: 25, gap: 15, alignItems: "center",
          }}>
            <View style={{
              backgroundColor: "#FFF0DF", borderRadius: 22,
              width: 70, height: 70, alignItems: "center", justifyContent: "center",
            }}>
              <LogOut size={29} color={colors.orange} />
            </View>
            <T heading style={{ fontSize: 25, textAlign: "center" }}>
              Sair da conta?
            </T>
            <T style={{ textAlign: "center", color: colors.muted, lineHeight: 22 }}>
              Você poderá entrar novamente quando quiser. Seus pedidos e suas informações continuarão salvos.
            </T>
            <View style={{ width: "100%", gap: 10, marginTop: 8 }}>
              <Button title="Continuar no Condovery"
                disabled={loggingOut}
                onPress={() => setLogoutOpen(false)} />
              <Button title={loggingOut ? "Saindo..." : "Sim, sair da conta"}
                secondary disabled={loggingOut}
                onPress={() => void confirmLogout()} />
            </View>
          </View>
        </View>
      </Modal>
    <Screen title="Minha conta">
      <View style={{ gap: 4 }}>
        <T heading style={{ fontSize: 28 }}>Meu perfil</T>
        <T style={{ color: colors.muted }}>
          Seu endereço, seus pedidos e tudo sobre sua conta.
        </T>
      </View>
      <Card style={{ gap: 17 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, overflow: "hidden" }}>
            <Picture
              path={viewer?.avatar_image}
              label="Minha foto"
              height={72}
              radius={36}
              fallback={
                <View style={{
                  flex: 1, justifyContent: "center", alignItems: "center",
                  backgroundColor: "#F0E8D8",
                }}>
                  <T heading style={{ fontSize: 27 }}>
                    {viewer?.name.charAt(0).toUpperCase() ?? "?"}
                  </T>
                </View>
              }
            />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <T bold style={{ fontSize: 17 }}>{viewer?.name}</T>
            <T style={{ fontSize: 12, color: colors.muted }}>{viewer?.email}</T>
            <T style={{ fontSize: 12, color: colors.muted }} numberOfLines={2}>
              {viewer?.condominium_name} · {viewer?.tower} · Apto. {viewer?.apartment}
            </T>
          </View>
        </View>
        <Button
          title="Editar meu perfil e minha foto"
          secondary
          onPress={() => router.push("/perfil")}
        />
      </Card>
      <View style={{ gap: 0 }}>
        {shortcuts.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            onPress={item.onPress}
            style={{
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 13,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 13,
            }}
          >
            {item.icon}
            <View style={{ flex: 1, gap: 2 }}>
              <T bold style={{ fontSize: 14 }}>{item.label}</T>
              <T style={{ color: colors.muted, fontSize: 11, lineHeight: 16 }}>
                {item.description}
              </T>
            </View>
            <ChevronRight size={19} color={colors.muted} />
          </Pressable>
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <T heading style={{ fontSize: 20 }}>Privacidade e termos</T>
        <T style={{ color: colors.muted, fontSize: 12 }}>
          Consulte como seus dados são tratados e as regras de uso do Condovery.
        </T>
        <Button
          title="Termos de uso"
          secondary
          onPress={() => void openWeb(auth.api.web("/termos-de-uso")).catch(alertError)}
        />
        <Button
          title="Política de privacidade"
          secondary
          onPress={() =>
            void openWeb(auth.api.web("/politica-de-privacidade")).catch(alertError)
          }
        />
      </View>
    </Screen>
    </>
  );
}
export function Profile() {
  const { viewer, api, refresh } = useAuth();
  const [form, setForm] = useState({
      name: viewer?.name ?? "",
      phone: viewer?.phone ?? "",
      tower: viewer?.tower ?? "",
      apartment: viewer?.apartment ?? "",
      avatar_image: viewer?.avatar_image ?? "",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const set = (key: keyof typeof form, value: string) =>
    setForm((v) => ({ ...v, [key]: value }));
  const photo = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const url = await uploadPicture(api, "profile");
      if (!url) return;
      // Save the same server-side users.avatar_image used by web and mobile
      // immediately; do not require a second "Salvar meus dados" action.
      if (!viewer) throw new Error("Sessão indisponível.");
      await api.request("me", "PATCH", {
        name: viewer.name,
        phone: viewer.phone,
        tower: viewer.tower,
        apartment: viewer.apartment,
        avatar_image: url,
      });
      set("avatar_image", url);
      await refresh();
      setMessage("Foto de perfil atualizada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível atualizar a foto.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Meu perfil" back>
      <ErrorBox message={error} />
      <Picture path={form.avatar_image} label="Minha foto" height={140} />
      <Button
        title="Trocar foto de perfil"
        secondary
        busy={busy}
        onPress={() => void photo()}
      />
      <Field
        label="Nome"
        value={form.name}
        onChangeText={(v) => set("name", v)}
        maxLength={90}
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
        {viewer?.towers.map((t) => (
          <Pressable
            key={t}
            onPress={() => set("tower", t)}
            style={{
              padding: 10,
              borderRadius: 22,
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
      <Button
        title="Salvar meus dados"
        busy={busy}
        onPress={() => {
          setBusy(true);
          setError("");
          api
            .request("me", "PATCH", form)
            .then(refresh)
            .then(() => setMessage("Perfil atualizado."))
            .catch((e) => setError(e.message))
            .finally(() => setBusy(false));
        }}
      />
      {message && <T style={{ color: colors.green }}>{message}</T>}
    </Screen>
  );
}
export function DeleteAccount() {
  const auth = useAuth();
  const [confirmation, setConfirmation] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Screen title="Excluir minha conta" back>
      <T heading style={{ fontSize: 25 }}>
        Excluir minha conta
      </T>
      <T>
        A exclusão encerra seu perfil e sua loja, se houver. Pedidos em
        andamento precisam ser resolvidos. O histórico necessário será
        preservado de forma anonimizada.
      </T>
      <ErrorBox message={error} />
      <Field
        label="Digite EXCLUIR para confirmar"
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
      />
      <Field
        label="Senha atual (para contas com senha)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title="Excluir definitivamente"
        busy={busy}
        disabled={confirmation !== "EXCLUIR"}
        onPress={() =>
          Alert.alert(
            "Excluir definitivamente?",
            "Esta ação encerra sua conta.",
            [
              { text: "Voltar", style: "cancel" },
              {
                text: "Excluir",
                style: "destructive",
                onPress: () => {
                  setBusy(true);
                  auth.api
                    .request("me", "DELETE", {
                      confirmation,
                      password: password || undefined,
                    })
                    .then(() => auth.logout().catch(() => {}))
                    .catch((e) => setError(e.message))
                    .finally(() => setBusy(false));
                },
              },
            ],
          )
        }
      />
    </Screen>
  );
}
type PushPreferences = {
  condominium: boolean;
  orders: boolean;
  seller_orders: boolean;
};
export function Preferences() {
  const { api } = useAuth();
  const push = usePush(false);
  const r = useResource<{ preferences: PushPreferences; is_seller: boolean }>(
    "push/preferences",
  );
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <Screen title="Notificações" back>
      <T heading style={{ fontSize: 26 }}>
        Fique por dentro da vizinhança
      </T>
      <T>
        Escolha quais avisos você deseja receber no aparelho. Os avisos também
        ficam disponíveis na sua conta.
      </T>
      <Button
        title="Ativar notificações neste aparelho"
        busy={busy}
        onPress={() => {
          setBusy(true);
          push
            .activate()
            .then(() => setMessage("Notificações ativadas neste aparelho."))
            .catch(alertError)
            .finally(() => setBusy(false));
        }}
      />
      {message && <T style={{ color: colors.green }}>{message}</T>}
      <ErrorBox message={r.error} />
      {r.loading && <Loading />}
      {r.data &&
        (
          [
            ["condominium", "Avisos do condomínio"],
            ["orders", "Atualizações dos meus pedidos"],
            ...(r.data.is_seller
              ? [["seller_orders", "Novos pedidos na minha loja"]]
              : []),
          ] as [keyof PushPreferences, string][]
        ).map(([key, label]) => (
          <Card
            key={key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <T style={{ flex: 1 }}>{label}</T>
            <Switch
              accessibilityLabel={label}
              value={r.data!.preferences[key]}
              disabled={busy}
              trackColor={{ true: colors.orange }}
              onValueChange={(value) => {
                setBusy(true);
                api
                  .request("push/preferences", "PATCH", {
                    ...r.data!.preferences,
                    [key]: value,
                  })
                  .then(() => r.reload())
                  .catch(alertError)
                  .finally(() => setBusy(false));
              }}
            />
          </Card>
        ))}
    </Screen>
  );
}
export function Inbox() {
  const [page, setPage] = useState(0);
  const r = useResource<{ notifications: Notice[]; hasMore: boolean }>(
    "push/inbox?page=" + page,
  );
  const items = r.data?.notifications ?? [];
  return (
    <Screen title="Notificações" back>
      <T heading style={{ fontSize: 27 }}>
        Notificações
      </T>
      <ErrorBox
        message={r.error}
        retry={() => void r.reload().catch(() => {})}
      />
      {items.map((n) => (
        <Pressable
          key={n.id}
          onPress={() =>
            router.push({ pathname: "/aviso/[id]", params: { id: n.id } })
          }
        >
          <Card style={!n.read_at ? { borderColor: colors.orange } : undefined}>
            <T bold>{n.title}</T>
            <T>{n.body}</T>
            <T style={{ fontSize: 11, color: colors.muted }}>
              {new Date(n.created_at).toLocaleString("pt-BR")}
            </T>
          </Card>
        </Pressable>
      ))}
      {r.loading && <Loading />}
      {!r.loading && !items.length && !r.error && (
        <Empty
          title="Tudo em dia por aqui"
          body="Os avisos do condomínio e as atualizações de pedidos aparecerão aqui."
        />
      )}
      {page > 0 && (
        <Button
          title="Avisos anteriores"
          secondary
          onPress={() => setPage((n) => n - 1)}
        />
      )}
      {r.data?.hasMore && (
        <Button
          title="Próximos avisos"
          secondary
          onPress={() => setPage((n) => n + 1)}
        />
      )}
      <Button
        title="Preferências de notificações"
        secondary
        onPress={() => router.push("/preferencias")}
      />
    </Screen>
  );
}
export function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();
  const r = useResource<{ notification: Notice }>("push/inbox/" + id);
  const n = r.data?.notification;
  useEffect(() => {
    if (n) void api.request("push/inbox/" + id, "PATCH").catch(() => {});
  }, [n, api, id]);
  return (
    <Screen title="Aviso" back>
      <ErrorBox message={r.error} />
      {r.loading && <Loading />}
      {n && (
        <>
          <T heading style={{ fontSize: 27, lineHeight: 34 }}>
            {n.title}
          </T>
          <T>{n.body}</T>
          <T style={{ color: colors.muted, fontSize: 12 }}>
            {new Date(n.created_at).toLocaleString("pt-BR")}
          </T>
          {n.kind === "order" && n.target_id && (
            <Button
              title="Ver meu pedido"
              onPress={() =>
                router.push({
                  pathname: "/pedido/[id]",
                  params: { id: n.target_id! },
                })
              }
            />
          )}
          {n.kind === "shop" && n.target_id && (
            <Button
              title="Visitar loja"
              onPress={() =>
                router.push({
                  pathname: "/loja/[id]",
                  params: { id: n.target_id! },
                })
              }
            />
          )}
          {n.kind === "seller_order" && (
            <Button
              title="Abrir painel da loja no navegador"
              onPress={() =>
                void openWeb(api.web("/?painel=vendedor")).catch(alertError)
              }
            />
          )}
        </>
      )}
    </Screen>
  );
}
export function Report() {
  const { id, tipo } = useLocalSearchParams<{
    id: string;
    tipo: "shop" | "product";
  }>();
  const { api } = useAuth();
  const [reason, setReason] = useState("other"),
    [details, setDetails] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <Screen title="Denunciar conteúdo" back>
      <T>Conte à administração o que precisa ser analisado.</T>
      {[
        ["language", "Linguagem imprópria"],
        ["image", "Imagem imprópria"],
        ["inappropriate", "Conteúdo inadequado"],
        ["other", "Outro motivo"],
      ].map(([key, label]) => (
        <Button
          key={key}
          title={label}
          secondary={key !== reason}
          onPress={() => setReason(key)}
        />
      ))}
      <Field
        label="Detalhes (opcional)"
        value={details}
        onChangeText={setDetails}
        maxLength={250}
        multiline
      />
      <Button
        title="Enviar denúncia"
        disabled={!!message}
        busy={busy}
        onPress={() => {
          setBusy(true);
          api
            .request<{ message: string }>("reports", "POST", {
              target_type: tipo,
              target_id: id,
              reason,
              details,
            })
            .then((r) => setMessage(r.message))
            .catch(alertError)
            .finally(() => setBusy(false));
        }}
      />
      {message && <T>{message}</T>}
    </Screen>
  );
}
export function Help() {
  const [query, setQuery] = useState("");
  return (
    <Screen title="Central de ajuda" back>
      <T heading style={{ fontSize: 27 }}>
        Como podemos ajudar?
      </T>
      <Field label="Buscar ajuda" value={query} onChangeText={setQuery} />
      {helpArticles
        .filter(
          (a) =>
            a.area === "resident" &&
            (a.title + " " + a.steps.join(" "))
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .map((a) => (
          <Card key={a.id}>
            <T heading style={{ fontSize: 19 }}>
              {a.title}
            </T>
            {a.steps.map((step, i) => (
              <T key={i}>
                {i + 1}. {step}
              </T>
            ))}
            {a.note && (
              <T style={{ color: colors.muted, fontSize: 12 }}>{a.note}</T>
            )}
          </Card>
        ))}
    </Screen>
  );
}
