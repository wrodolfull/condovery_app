import { Linking } from "react-native";
export async function openWhatsApp(value: string) {
  const u = new URL(value);
  if (
    u.protocol !== "https:" ||
    u.hostname !== "wa.me" ||
    !/^\/\d{10,15}$/.test(u.pathname)
  )
    throw new Error("Link do pedido inválido.");
  try {
    await Linking.openURL(
      "whatsapp://send?phone=" +
        u.pathname.slice(1) +
        "&text=" +
        encodeURIComponent(u.searchParams.get("text") ?? ""),
    );
  } catch {
    await Linking.openURL(value);
  }
}
export async function openWeb(value: string) {
  const u = new URL(value);
  if (!["https:", "http:"].includes(u.protocol) || u.username || u.password)
    throw new Error("Link inválido.");
  await Linking.openURL(value);
}
