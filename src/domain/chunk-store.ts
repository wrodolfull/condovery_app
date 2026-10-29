export type KeyValueStore = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};
type Manifest = { version: string; parts: number };
export function createChunkStore(storage: KeyValueStore) {
  let writes = Promise.resolve(),
    serial = 0;
  const manifest = async (key: string): Promise<Manifest | null> => {
    try {
      const raw = await storage.get(key + ".manifest");
      if (!raw) return null;
      const m = JSON.parse(raw) as Manifest;
      return /^[a-z0-9.]+$/.test(m.version) &&
        Number.isInteger(m.parts) &&
        m.parts > 0 &&
        m.parts <= 4096
        ? m
        : null;
    } catch {
      return null;
    }
  };
  return {
    save: (key: string, value: unknown) => {
      writes = writes
        .catch(() => {})
        .then(async () => {
          const old = await manifest(key),
            raw = JSON.stringify(value),
            version = Date.now().toString(36) + "." + (++serial).toString(36);
          const characters = Array.from(raw);
          const parts = Math.ceil(characters.length / 400);
          if (parts > 4096)
            throw new Error("O carrinho excedeu o limite de armazenamento.");
          for (let i = 0; i < parts; i++)
            await storage.set(
              key + "." + version + "." + i,
              characters.slice(i * 400, (i + 1) * 400).join(""),
            );
          // Commit the pointer last: interruption cannot overwrite a valid pending attempt.
          await storage.set(
            key + ".manifest",
            JSON.stringify({ version, parts }),
          );
          if (old)
            for (let i = 0; i < old.parts; i++)
              await storage.remove(key + "." + old.version + "." + i);
        });
      return writes;
    },
    load: async (key: string): Promise<unknown> => {
      const m = await manifest(key);
      if (!m) return null;
      let raw = "";
      for (let i = 0; i < m.parts; i++) {
        const chunk = await storage.get(key + "." + m.version + "." + i);
        if (chunk === null) return null;
        raw += chunk;
      }
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
  };
}
