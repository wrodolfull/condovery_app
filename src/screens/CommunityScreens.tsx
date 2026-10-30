import React, { useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays } from "lucide-react-native";
import { FairArt, fairDate } from "../components/FairCards";
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
  ProductGrid,
  Screen,
  T,
  alertError,
} from "../ui";
import { colors } from "../theme";
import { uploadPicture } from "../upload";
import { openWhatsApp } from "../external";
import type { Product, CommunityFair } from "../types";
export function Fairs() {
  const resource = useResource<{ fairs: CommunityFair[] }>("fairs");
  return (
    <Screen title="Feiras do condomínio" back>
      <View style={{ gap: 6 }}>
        <T heading style={{ fontSize: 27 }}>
          Feiras do condomínio
        </T>
        <T style={{ color: colors.muted }}>
          Produtos escolhidos pela comunidade, vendidos diretamente pelas lojas
          participantes.
        </T>
      </View>
      <ErrorBox
        message={resource.error}
        retry={() => void resource.reload().catch(() => {})}
      />
      {resource.loading && <Loading />}
      {resource.data?.fairs.map((fair) => (
        <Card key={fair.id} style={{ padding: 16, borderRadius: 16 }}>
          <FairArt fair={fair} />
          <T heading style={{ fontSize: 22 }}>
            {fair.title}
          </T>
          <T>{fair.description}</T>
          <T style={{ color: colors.muted }}>Até {fairDate(fair.ends_at)}</T>
          <Button
            title="Explorar feira"
            onPress={() =>
              router.push({ pathname: "/feira/[id]", params: { id: fair.id } })
            }
          />
        </Card>
      ))}
      {resource.data && !resource.data.fairs.length && (
        <T style={{ color: colors.muted }}>
          Nenhuma feira acontecendo no momento.
        </T>
      )}
    </Screen>
  );
}
export function Fair() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useResource<{ fair: CommunityFair; products: Product[] }>(
    "fairs/" + id,
  );
  return (
    <Screen title="Feiras do condomínio" back backLabel="Ver todas as feiras">
      <ErrorBox
        message={resource.error}
        retry={() => void resource.reload().catch(() => {})}
      />
      {resource.loading && <Loading />}
      {resource.data && (
        <>
          <FairArt fair={resource.data.fair} />
          <T heading style={{ fontSize: 27 }}>
            {resource.data.fair.title}
          </T>
          <T>{resource.data.fair.description}</T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <CalendarDays size={15} color={colors.muted} />
            <T style={{ color: colors.muted, flex: 1 }}>
              {fairDate(resource.data.fair.starts_at)} até{" "}
              {fairDate(resource.data.fair.ends_at)}
            </T>
          </View>
          <ProductGrid products={resource.data.products} />
          {!resource.data.products.length && (
            <T style={{ color: colors.muted }}>
              Ainda não há produtos disponíveis nesta feira.
            </T>
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
                          '" no Elevadoor. Ainda está disponível?',
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
