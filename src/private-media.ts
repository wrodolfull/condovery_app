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

function base64Image(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" &&
          /^data:image\/(?:png|jpeg|webp);base64,/i.test(reader.result))
        resolve(reader.result);
      else reject(new Error("Imagem inválida."));
    };
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(blob);
  });
}

export async function loadPrivateMedia(url: string, token: string): Promise<string> {
  const parsed = new URL(url);
  if (!/^\/api\/media\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(parsed.pathname) ||
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
    const blob = await response.blob();
    if (blob.size > MAX_BYTES) throw new Error("Imagem muito grande.");
    const data = await base64Image(blob);
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
