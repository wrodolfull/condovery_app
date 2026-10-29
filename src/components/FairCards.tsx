import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, Gift } from "lucide-react-native";
import { useResource } from "../hooks";
import { Picture, T } from "../ui";
import type { CommunityFair } from "../types";

export const fairDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
export function FairArt({ fair }: { fair: CommunityFair }) {
  const fallback = (
    <View style={{
      borderRadius: 12, backgroundColor: "#282726", flexDirection: "row",
      alignItems: "center", gap: 12, padding: 24, minHeight: 100,
    }}>
      <Gift size={28} color="white" />
      <T bold style={{ flex: 1, color: "white" }}>{fair.title}</T>
    </View>
  );
  return fair.cover_image_url ? (
    <Picture
      path={fair.cover_image_url}
      label={"Capa de " + fair.title}
      aspectRatio={16 / 7}
      radius={12}
      fallback={fallback}
    />
  ) : fallback;
}
export function FairHomeTeaser() {
  const { data } = useResource<{ fairs: CommunityFair[] }>("fairs");
  if (!data?.fairs.length) return null;
  return (
    <View accessibilityLabel="Feiras do condomínio" style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <T heading style={{ fontSize: 21, flex: 1 }}>
          Feiras da vizinhança
        </T>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/feiras")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderWidth: 1,
            borderColor: "#E8E3D9",
            borderRadius: 12,
            padding: 10,
          }}
        >
          <T bold style={{ fontSize: 12 }}>
            Ver feiras
          </T>
          <ArrowRight size={16} color="#251F18" />
        </Pressable>
      </View>
      {data.fairs.slice(0, 3).map((fair) => (
        <Pressable
          key={fair.id}
          accessibilityRole="button"
          accessibilityLabel={"Ver feiras: " + fair.title}
          onPress={() => router.push("/feiras")}
          style={{
            padding: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#EEEEEE",
            backgroundColor: "#FFFEFA",
          }}
        >
          <FairArt fair={fair} />
          <T bold style={{ marginTop: 9 }}>
            {fair.title}
          </T>
          <T style={{ fontSize: 12 }}>Até {fairDate(fair.ends_at)}</T>
        </Pressable>
      ))}
    </View>
  );
}
