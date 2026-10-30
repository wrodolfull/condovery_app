/**
 * Load private media through JS fetch instead of React Native's platform
 * image loader, which can omit Authorization in Expo Go / Android.
 * Never put credentials into the URL or expose a public storage endpoint.
 */
const MAX_BYTES = 5 * 1024 * 1024;
const CACHE_BYTES = 10 * 1024 * 1024;
const cache = new Map<string, { data: string; bytes: number }>();
const pending = new Map<string, Promise<string>>();
let cacheSize = 0;

// Convert the fetched ArrayBuffer directly; avoid React Native Blob/FileReader
// copies and the extra native-to-JS roundtrip warned about by Expo SDK 57.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
export function imageDataUri(buffer: ArrayBuffer, mime: string): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.byteLength > MAX_BYTES ||
      !["image/webp", "image/png", "image/jpeg"].includes(mime))
    throw new Error("Imagem inválida ou muito grande.");
  const chunks: string[] = [];
  let part = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const x = bytes[i];
    const y = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const z = i + 2 < bytes.length ? bytes[i + 2] : 0;
    part += ALPHABET[x >> 2] +
      ALPHABET[((x & 3) << 4) | (y >> 4)] +
      (i + 1 < bytes.length ? ALPHABET[((y & 15) << 2) | (z >> 6)] : "=") +
      (i + 2 < bytes.length ? ALPHABET[z & 63] : "=");
    if (part.length >= 16384) {
      chunks.push(part);
      part = "";
    }
  }
  chunks.push(part);
  return "data:" + mime + ";base64," + chunks.join("");
}

export async function loadPrivateMedia(url: string, token: string, trustedOrigin: string): Promise<string> {
  // The bearer token may be sent ONLY to our configured API origin.
  // A URL with a valid /api/media/<uuid> path on an external host is not safe.
  const parsed = new URL(url);
  if (!trustedOrigin || parsed.origin !== trustedOrigin ||
      !/^\/api\/media\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(parsed.pathname) ||
      parsed.username || parsed.password || parsed.hash ||
      !/^[0-9a-f]{64}$/.test(token))
    throw new Error("Imagem ou sessão inválida.");
  const key = token + "|" + url;
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit.data;
  }
  const existing = pending.get(key);
  if (existing) return existing;
  const work = (async () => {
    const response = await fetch(url, {
      headers: { Authorization: "Bearer " + token, Accept: "image/webp,image/png,image/jpeg" },
      credentials: "omit",
      redirect: "error",
    });
    if (!response.ok) throw new Error("Imagem indisponível: " + response.status);
    const mime = (response.headers.get("content-type") ?? "").split(";")[0].toLowerCase();
    if (!["image/webp", "image/png", "image/jpeg"].includes(mime))
      throw new Error("Resposta não é uma imagem.");
    if (Number(response.headers.get("content-length") ?? 0) > MAX_BYTES)
      throw new Error("Imagem muito grande.");
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) throw new Error("Imagem muito grande.");
    const data = imageDataUri(buffer, mime);
    const bytes = data.length * 2;
    if (bytes <= CACHE_BYTES) {
      cache.set(key, { data, bytes });
      cacheSize += bytes;
      while (cacheSize > CACHE_BYTES) {
        const oldest = cache.keys().next().value;
        if (!oldest) break;
        const entry = cache.get(oldest)!;
        cacheSize -= entry.bytes;
        cache.delete(oldest);
      }
    }
    return data;
  })();
  pending.set(key, work);
  try { return await work; }
  finally { pending.delete(key); }
}

export function clearPrivateMediaCache() {
  cache.clear();
  cacheSize = 0;
}
