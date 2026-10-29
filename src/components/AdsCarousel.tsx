import { useCallback, useRef, useState } from "react";
import { AppState, Pressable, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUpRight, MapPin } from "lucide-react-native";
import { useAuth } from "../auth";
import { openWeb } from "../external";
import { Picture, T, alertError } from "../ui";

export type AdCampaign = {
  id: string;
  merchant_name: string;
  headline: string;
  description: string;
  location: string;
  image_url: string | null;
  destination_url: string;
};

export function AdsCarousel({ campaigns }: { campaigns: AdCampaign[] }) {
  const { api } = useAuth();
  const [index, setIndex] = useState(0);
  const target = useRef<View>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const seen = useRef(new Set<string>());
  const dimensions = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const ad = campaigns[index % campaigns.length];
  useFocusEffect(
    useCallback(() => {
      if (campaigns.length < 2) return;
      const timer = setInterval(() => {
        if (AppState.currentState === "active")
          setIndex((i) => (i + 1) % campaigns.length);
      }, 8500);
      return () => clearInterval(timer);
    }, [campaigns.length]),
  );
  useFocusEffect(
    useCallback(() => {
      if (!ad) return;
      const timer = setInterval(() => {
        if (seen.current.has(ad.id) || AppState.currentState !== "active")
          return;
        target.current?.measureInWindow((x, y, width, height) => {
          const visibleWidth = Math.max(
            0,
            Math.min(x + width, dimensions.width - insets.right) -
              Math.max(insets.left, x),
          );
          const visibleHeight = Math.max(
            0,
            Math.min(y + height, dimensions.height - insets.bottom - 90) -
              Math.max(insets.top + 70, y),
          );
          if (
            width > 0 &&
            height > 0 &&
            visibleWidth * visibleHeight >= width * height * 0.5
          ) {
            seen.current.add(ad.id);
            void api
              .request("ads/" + ad.id + "/impression", "POST")
              .catch(() => {});
          }
        });
      }, 750);
      return () => clearInterval(timer);
    }, [ad, api, dimensions.width, dimensions.height, insets]),
  );
  if (!ad) return null;
  return (
    <View
      ref={target}
      collapsable={false}
      style={{ gap: 12 }}
      accessibilityLabel="Ofertas perto de você"
    >
      <T
        heading
        style={{
          fontSize: Math.min(25, Math.max(19, dimensions.width * 0.04)),
        }}
      >
        Ofertas perto de você
      </T>
      <View
        onTouchStart={(e) => {
          touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start || campaigns.length < 2) return;
          const dx = e.nativeEvent.pageX - start.x,
            dy = e.nativeEvent.pageY - start.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy))
            setIndex(
              (i) =>
                (i + (dx < 0 ? 1 : campaigns.length - 1)) % campaigns.length,
            );
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
        style={{
          overflow: "hidden",
          borderRadius: 20,
          backgroundColor: "white",
          borderWidth: 1,
          borderColor: "#E8E8E8",
          boxShadow: "0 7px 22px rgba(0,0,0,.06)",
        }}
      >
        <View>
          <Picture
            path={ad.image_url}
            label={ad.headline}
            height={Math.min(330, Math.max(190, dimensions.width * 0.48))}
            radius={0}
            fallback={
              <View style={{
                flex: 1, backgroundColor: "#F4F4F4", padding: 18,
                justifyContent: "center", alignItems: "center", gap: 8,
              }}>
                <T bold style={{ textAlign: "center" }}>{ad.merchant_name}</T>
                <T style={{ textAlign: "center", color: "#626262" }}>
                  {ad.headline}
                </T>
              </View>
            }
          />
          <View
            style={{
              position: "absolute",
              right: 14,
              top: 14,
              backgroundColor: "#111111",
              borderRadius: 999,
              paddingVertical: 8,
              paddingHorizontal: 13,
            }}
          >
            <T
              bold
              style={{
                fontSize: 11,
                lineHeight: 17,
                color: "white",
                letterSpacing: 0.44,
              }}
            >
              PUBLICIDADE
            </T>
          </View>
        </View>
        <View
          style={{ paddingTop: 19, paddingHorizontal: 18, paddingBottom: 20 }}
        >
          <T bold style={{ fontSize: 15, marginBottom: 5 }}>
            {ad.merchant_name}
          </T>
          <T
            heading
            style={{
              fontSize: Math.min(25, Math.max(20, dimensions.width * 0.04)),
              lineHeight: 24,
              marginBottom: 6,
            }}
          >
            {ad.headline}
          </T>
          <T
            style={{
              fontSize: 14,
              lineHeight: 21,
              color: "#626262",
              marginBottom: 17,
            }}
          >
            {ad.description}
          </T>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                flexShrink: 1,
              }}
            >
              <MapPin size={16} color="#555555" />
              <T style={{ fontSize: 13, color: "#555555", flexShrink: 1 }}>
                {ad.location}
              </T>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={"Ver oferta de " + ad.merchant_name}
              onPress={() => {
                void api
                  .request("ads/" + ad.id + "/click", "POST")
                  .catch(() => {});
                void openWeb(ad.destination_url).catch(alertError);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                backgroundColor: "#111111",
                borderRadius: 13,
                paddingVertical: 12,
                paddingHorizontal: 17,
              }}
            >
              <T bold style={{ color: "white", fontSize: 13 }}>
                Ver oferta
              </T>
              <ArrowUpRight size={16} color="white" />
            </Pressable>
          </View>
        </View>
      </View>
      {campaigns.length > 1 && (
        <View
          accessibilityLabel="Navegar entre anúncios"
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginTop: 1,
          }}
        >
          {campaigns.map((campaign, i) => (
            <Pressable
              key={campaign.id}
              accessibilityRole="button"
              accessibilityLabel={`Anúncio ${i + 1}`}
              accessibilityState={{ selected: i === index % campaigns.length }}
              aria-selected={i === index % campaigns.length}
              onPress={() => setIndex(i)}
              hitSlop={7}
              style={{ padding: 6 }}
            >
              <View
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor:
                    i === index % campaigns.length ? "#111111" : "#D0D0D0",
                }}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
