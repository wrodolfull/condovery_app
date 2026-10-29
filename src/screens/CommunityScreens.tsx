import React, { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "../auth";
import { useResource } from "../hooks";
import {
  Button,
  Card,
  Empty,
  ErrorBox,
  Field,
  Loading,
  Picture,
  ProductCard,
  Screen,
  T,
  alertError,
} from "../ui";
import { colors } from "../theme";
import { uploadPicture } from "../upload";
import { openWhatsApp } from "../external";
import type { Product } from "../types";
export function Fair() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useResource<{
    fair: {
      title: string;
      description: string;
      cover_image_url: string | null;
    };
    products: Product[];
  }>("fairs/" + id);
  return (
    <Screen title="Feira do condomínio" back>
      <ErrorBox
        message={r.error}
        retry={() => void r.reload().catch(() => {})}
      />
      {r.loading && <Loading />}
      {r.data && (
        <>
          <Picture
            path={r.data.fair.cover_image_url}
            label={r.data.fair.title}
            height={180}
          />
          <T heading style={{ fontSize: 27 }}>
            {r.data.fair.title}
          </T>
          <T>{r.data.fair.description}</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {r.data.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </View>
          {!r.data.products.length && (
            <Empty
              title="A feira está sendo preparada"
              body="Volte em breve para conferir os produtos."
            />
          )}
        </>
      )}
    </Screen>
  );
}
type Giveaway = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  status: "available" | "reserved" | "donated";
  owner_name: string;
  contact_whatsapp: string | null;
};
export function Giveaways() {
  const { api, viewer } = useAuth();
  const r = useResource<{ items: Giveaway[] }>("giveaways");
  const [editing, setEditing] = useState<Giveaway | null | false>(false),
    [current, setCurrent] = useState<Giveaway | null>(null),
    [form, setForm] = useState({
      title: "",
      description: "",
      image_url: "",
      contact_whatsapp: "",
    }),
    [busy, setBusy] = useState(false);
  const edit = (g: Giveaway | null) => {
    setEditing(g);
    setForm({
      title: g?.title ?? "",
      description: g?.description ?? "",
      image_url: g?.image_url ?? "",
      contact_whatsapp: g?.contact_whatsapp ?? "",
    });
    setCurrent(null);
  };
  const save = async () => {
    setBusy(true);
    try {
      await api.request(
        editing ? "giveaways/" + editing.id : "giveaways",
        editing ? "PUT" : "POST",
        form,
      );
      setEditing(false);
      await r.reload();
    } catch (e) {
      alertError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Desapego" back>
      <T heading style={{ fontSize: 28 }}>
        Desapego
      </T>
      <T>O que você não usa pode fazer a diferença para um vizinho.</T>
      <ErrorBox message={r.error} />
      {editing !== false ? (
        <Card>
          <T heading style={{ fontSize: 22 }}>
            {editing ? "Editar desapego" : "Novo desapego"}
          </T>
          <Field
            label="Título"
            value={form.title}
            maxLength={120}
            onChangeText={(title) => setForm((f) => ({ ...f, title }))}
          />
          <Field
            label="Descrição"
            value={form.description}
            onChangeText={(description) =>
              setForm((f) => ({ ...f, description }))
            }
            multiline
            maxLength={600}
          />
          <Picture path={form.image_url} label={form.title} height={160} />
          <Button
            title="Escolher imagem"
            busy={busy}
            secondary
            onPress={() => {
              setBusy(true);
              uploadPicture(api, "giveaway")
                .then((url) => {
                  if (url) setForm((f) => ({ ...f, image_url: url }));
                })
                .catch(alertError)
                .finally(() => setBusy(false));
            }}
          />
          <Field
            label="WhatsApp para contato (opcional)"
            value={form.contact_whatsapp}
            onChangeText={(contact_whatsapp) =>
              setForm((f) => ({ ...f, contact_whatsapp }))
            }
            keyboardType="phone-pad"
            maxLength={20}
          />
          <Button
            title="Salvar desapego"
            busy={busy}
            onPress={() => void save()}
          />
          <Button title="Voltar" secondary onPress={() => setEditing(false)} />
        </Card>
      ) : (
        <Button title="Publicar meu desapego" onPress={() => edit(null)} />
      )}
      {r.loading && <Loading />}
      {current && (
        <Card>
          <Picture
            path={current.image_url}
            label={current.title}
            height={250}
          />
          <T heading style={{ fontSize: 23 }}>
            {current.title}
          </T>
          <T>{current.description}</T>
          <T>{current.owner_name}</T>
          {current.user_id !== viewer?.id &&
            current.status === "available" &&
            current.contact_whatsapp && (
              <Button
                title="Falar com o vizinho"
                onPress={() =>
                  void openWhatsApp(
                    "https://wa.me/" +
                      current.contact_whatsapp!.replace(/\D/g, "") +
                      "?text=" +
                      encodeURIComponent(
                        'Olá! Vi seu desapego "' +
                          current.title +
                          '" no Condovery. Ainda está disponível?',
                      ),
                  ).catch(alertError)
                }
              />
            )}
          <Button
            title="Fechar detalhes"
            secondary
            onPress={() => setCurrent(null)}
          />
        </Card>
      )}
      {r.data?.items.map((g) => (
        <Card key={g.id}>
          <Pressable onPress={() => setCurrent(g)}>
            <Picture path={g.image_url} label={g.title} height={170} />
            <T heading style={{ fontSize: 21, marginTop: 10 }}>
              {g.title}
            </T>
            <T>{g.owner_name}</T>
            <T style={{ fontSize: 12, color: colors.muted }}>
              {
                {
                  available: "Disponível",
                  reserved: "Reservado",
                  donated: "Doado",
                }[g.status]
              }
            </T>
          </Pressable>
          {g.user_id === viewer?.id && (
            <>
              <Button
                title="Editar"
                secondary
                disabled={g.status === "donated"}
                onPress={() => edit(g)}
              />
              {g.status !== "donated" &&
                (["available", "reserved", "donated"] as const)
                  .filter((status) => status !== g.status)
                  .map((status) => (
                    <Button
                      key={status}
                      title={
                        {
                          available: "Disponibilizar",
                          reserved: "Marcar como reservado",
                          donated: "Marcar como doado",
                        }[status]
                      }
                      secondary
                      onPress={() =>
                        Alert.alert(
                          "Atualizar desapego?",
                          "Confirme a mudança de status.",
                          [
                            { text: "Voltar", style: "cancel" },
                            {
                              text: "Confirmar",
                              onPress: () =>
                                void api
                                  .request("giveaways/" + g.id, "PATCH", {
                                    status,
                                  })
                                  .then(() => r.reload())
                                  .catch(alertError),
                            },
                          ],
                        )
                      }
                    />
                  ))}
              <Button
                title="Excluir anúncio"
                secondary
                onPress={() =>
                  Alert.alert(
                    "Excluir anúncio?",
                    "Esta ação remove o desapego.",
                    [
                      { text: "Voltar", style: "cancel" },
                      {
                        text: "Excluir",
                        style: "destructive",
                        onPress: () =>
                          void api
                            .request("giveaways/" + g.id, "DELETE")
                            .then(() => r.reload())
                            .catch(alertError),
                      },
                    ],
                  )
                }
              />
            </>
          )}
        </Card>
      ))}
      {r.data && !r.data.items.length && (
        <Empty
          title="Nenhum desapego por enquanto"
          body="Quando seus vizinhos publicarem, os itens aparecerão aqui."
        />
      )}
    </Screen>
  );
}
