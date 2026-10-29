import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import type { ApiClient } from "./api";
export async function uploadPicture(
  api: ApiClient,
  kind: "profile" | "giveaway",
) {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: kind === "profile" ? [1, 1] : [4, 3],
    quality: 1,
  });
  if (picked.canceled) return null;
  const asset = picked.assets[0];
  if (
    asset.fileSize &&
    asset.fileSize > (kind === "giveaway" ? 5 : 10) * 1024 * 1024
  )
    throw new Error(
      "A imagem deve ter no máximo " +
        (kind === "giveaway" ? "5" : "10") +
        " MB.",
    );
  const scale = Math.min(1, 960 / asset.width, 960 / asset.height);
  const image = await ImageManipulator.manipulateAsync(
    asset.uri,
    [
      {
        resize: {
          width: Math.max(1, Math.round(asset.width * scale)),
          height: Math.max(1, Math.round(asset.height * scale)),
        },
      },
    ],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(image.uri)).blob();
    form.append("file", blob, "foto.jpg");
  } else
    form.append("file", {
      uri: image.uri,
      name: "foto.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
  const r = await api.request<{ url: string }>("media/" + kind, "POST", form);
  return r.url;
}
