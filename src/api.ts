export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function backendOrigin(value: string, development: boolean) {
  const u = new URL(value);
  if (
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    u.pathname !== "/" ||
    !["http:", "https:"].includes(u.protocol)
  )
    throw new Error("Endereço do backend inválido.");
  if (!development && u.protocol !== "https:")
    throw new Error("O backend precisa usar HTTPS.");
  return u.origin;
}
export class ApiClient {
  constructor(
    readonly origin: string,
    private token: string | null,
    private expired: () => void = () => {},
  ) {}
  setExpirationHandler(handler: () => void) {
    this.expired = handler;
  }
  async request<T>(
    path: string,
    method = "GET",
    body?: unknown,
    publicRequest = false,
  ): Promise<T> {
    if (!this.origin)
      throw new Error(
        "Configure EXPO_PUBLIC_API_URL para conectar ao Condovery.",
      );
    if (
      !/^([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/.test(path.split("?")[0]) ||
      path.startsWith("/") ||
      path.includes("://") ||
      path
        .split("?")[0]
        .split("/")
        .some((p) => p === ".." || p === "")
    )
      throw new Error("Rota inválida.");
    const abort = new AbortController(),
      timer = setTimeout(() => abort.abort(), 20000);
    try {
      const form = typeof FormData !== "undefined" && body instanceof FormData;
      const response = await fetch(this.origin + "/api/" + path, {
        method,
        credentials: "omit",
        signal: abort.signal,
        headers: {
          Accept: "application/json",
          ...(body !== undefined && !form
            ? { "Content-Type": "application/json" }
            : {}),
          ...(!publicRequest && this.token
            ? { Authorization: "Bearer " + this.token }
            : {}),
        },
        body:
          body === undefined
            ? undefined
            : form
              ? (body as FormData)
              : JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (
          response.status === 401 &&
          !publicRequest &&
          !(path === "me" && method === "DELETE")
        )
          this.expired();
        throw new ApiError(
          data.error ?? "Não foi possível concluir.",
          response.status,
        );
      }
      return data as T;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new Error(
        e instanceof Error && e.name === "AbortError"
          ? "A conexão demorou. Confira seus pedidos antes de repetir a compra."
          : "Não foi possível conectar. Verifique sua conexão e tente novamente.",
      );
    } finally {
      clearTimeout(timer);
    }
  }
  /** Native multipart upload. React Native's XHR transports file:// FormData
   * reliably on Android, without serializing the file as JSON or exposing credentials. */
  upload<T>(path: "media/profile" | "media/giveaway", form: FormData): Promise<T> {
    if (!this.token || !this.origin)
      return Promise.reject(new Error("Entre na sua conta antes de enviar uma imagem."));
    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", this.origin + "/api/" + path);
      xhr.timeout = 60000;
      xhr.setRequestHeader("Accept", "application/json");
      xhr.setRequestHeader("Authorization", "Bearer " + this.token);
      // Do not supply Content-Type: native FormData must generate its boundary.
      xhr.onload = () => {
        let payload: { error?: string } & Partial<T> = {};
        try { payload = JSON.parse(xhr.responseText || "{}"); } catch {}
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payload as T);
        } else {
          if (xhr.status === 401) this.expired();
          reject(new ApiError(payload.error || "Não foi possível enviar a imagem.", xhr.status));
        }
      };
      xhr.onerror = () => reject(new Error(
        "Não foi possível enviar a imagem. Verifique a conexão com o servidor.",
      ));
      xhr.ontimeout = () => reject(new Error("O envio da imagem demorou demais. Tente novamente."));
      xhr.send(form);
    });
  }
  image(path: string | null | undefined, scope: string) {
    if (!path || !/^\/api\/media\/[0-9a-f-]{36}$/i.test(path) || !this.token)
      return null;
    return {
      uri: this.origin + path + "?account=" + encodeURIComponent(scope),
      headers: { Authorization: "Bearer " + this.token },
      // Media IDs are immutable and scoped to the authenticated account.
      cache: "force-cache" as const,
    };
  }
  web(path: string) {
    return this.origin + path;
  }
}
