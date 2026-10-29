import assert from "node:assert/strict";
import test from "node:test";
import { ApiClient, ApiError, backendOrigin } from "../src/api";
import { dateForApi, formatPreferredDate } from "../src/domain/date";
test("the backend is a single trusted origin and production requires HTTPS", () => {
  assert.equal(
    backendOrigin("https://condovery.example", false),
    "https://condovery.example",
  );
  assert.equal(
    backendOrigin("http://192.168.0.10:3000", true),
    "http://192.168.0.10:3000",
  );
  for (const url of [
    "http://example.com",
    "https://user:secret@example.com",
    "https://example.com/api",
    "javascript:alert(1)",
  ])
    assert.throws(() => backendOrigin(url, false));
});
test("native requests use bearer, omit browser cookies and do not retry mutations", async () => {
  const original = globalThis.fetch;
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init: init! });
    return Response.json({ ok: true });
  };
  try {
    const api = new ApiClient("https://condovery.example", "a".repeat(64));
    await api.request("orders", "POST", { client_order_key: "key" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://condovery.example/api/orders");
    assert.equal(calls[0].init.credentials, "omit");
    assert.equal(
      (calls[0].init.headers as Record<string, string>).Authorization,
      "Bearer " + "a".repeat(64),
    );
    await assert.rejects(
      () => api.request("https://external.example"),
      /Rota inválida/,
    );
    await assert.rejects(
      () => api.request("../admin/summary"),
      /Rota inválida/,
    );
    await assert.rejects(() => api.request("%2e%2e/admin"), /Rota inválida/);
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = original;
  }
});
test("private media headers cannot be sent to external URLs", () => {
  const api = new ApiClient("https://condovery.example", "a".repeat(64));
  assert.equal(api.image("https://external.example/picture", "account"), null);
  const media = api.image(
    "/api/media/771e965c-5e32-40aa-b2f1-11cc208260f8",
    "account",
  );
  assert.ok(media?.headers.Authorization);
  assert.equal(media?.cache, "force-cache");
});
test("expired sessions notify the session owner; a wrong deletion password does not log out", async () => {
  const original = globalThis.fetch;
  let expired = 0;
  globalThis.fetch = async () =>
    Response.json({ error: "Credencial inválida" }, { status: 401 });
  try {
    const api = new ApiClient(
      "https://condovery.example",
      "a".repeat(64),
      () => expired++,
    );
    await assert.rejects(() => api.request("home"), ApiError);
    assert.equal(expired, 1);
    await assert.rejects(
      () =>
        api.request("me", "DELETE", {
          confirmation: "EXCLUIR",
          password: "wrong",
        }),
      ApiError,
    );
    assert.equal(expired, 1);
  } finally {
    globalThis.fetch = original;
  }
});
test("preferred delivery dates are valid calendar dates without timezone conversion", () => {
  assert.equal(dateForApi(""), null);
  assert.equal(dateForApi("29/02/2028"), "2028-02-29");
  assert.throws(() => dateForApi("29/02/2027"));
  assert.throws(() => dateForApi("31/04/2027"));
});

test("registration and condominium lookup remain public while authenticated requests use bearer", async () => {
  const original = globalThis.fetch;
  const requests: RequestInit[] = [];
  globalThis.fetch = async (_input, init) => {
    requests.push(init!);
    return Response.json({ ok: true });
  };
  try {
    const api = new ApiClient("https://condovery.example", "a".repeat(64));
    await api.request("public/condominium", "POST", { invite: "my-invite" }, true);
    await api.request("auth/register", "POST", { email: "test@example.com" }, true);
    await api.request("catalog?page=1&limit=24");
    assert.equal(requests.length, 3);
    assert.equal((requests[0].headers as Record<string, string>).Authorization, undefined);
    assert.equal((requests[1].headers as Record<string, string>).Authorization, undefined);
    assert.equal(
      (requests[2].headers as Record<string, string>).Authorization,
      "Bearer " + "a".repeat(64),
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("private images use bearer fetch and deduplicate requests without exposing tokens in URLs", async () => {
  const { loadPrivateMedia, clearPrivateMediaCache } = await import("../src/private-media");
  const originalFetch = globalThis.fetch;
  const calls: { url: string; options: RequestInit }[] = [];
  globalThis.fetch = async (input, options) => {
    calls.push({ url: String(input), options: options! });
    return new Response(new Blob(["hello"], { type: "image/png" }), {
      headers: { "content-type": "image/png" },
    });
  };
  try {
    const url = "https://condovery.example/api/media/771e965c-5e32-40aa-b2f1-11cc208260f8?account=buyer";
    const token = "a".repeat(64);
    const [one, two] = await Promise.all([
      loadPrivateMedia(url, token), loadPrivateMedia(url, token),
    ]);
    assert.equal(one, two);
    assert.equal(await loadPrivateMedia(url, token), one);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, url);
    assert.equal(
      (calls[0].options.headers as Record<string, string>).Authorization,
      "Bearer " + token,
    );
    assert.equal(calls[0].options.credentials, "omit");
    assert.equal(calls[0].options.redirect, "error");
    await assert.rejects(() => loadPrivateMedia("https://external.example/pic.png", token), /inválida/);
    await assert.rejects(() => loadPrivateMedia(url, "bad"), /inválida/);
    assert.equal(calls.length, 1);
  } finally {
    clearPrivateMediaCache();
    globalThis.fetch = originalFetch;
  }
});

test("private image byte conversion handles padding and enforces MIME and size limits", async () => {
  const { imageDataUri } = await import("../src/private-media");
  const encode = (input: number[], mime = "image/png") =>
    imageDataUri(Uint8Array.from(input).buffer, mime);
  for (const bytes of [[], [0], [0, 1], [0, 1, 2], [255, 255, 255], [10, 20, 30, 40, 50]]) {
    assert.equal(
      encode(bytes),
      "data:image/png;base64," + Buffer.from(bytes).toString("base64"),
    );
  }
  assert.throws(() => encode([1], "text/html"), /inválida/);
  assert.throws(() => imageDataUri(new ArrayBuffer(5 * 1024 * 1024 + 1), "image/jpeg"), /inválida/);
});

test("preferred date mask formats digits, supports backspace and preserves API validation", () => {
  assert.equal(formatPreferredDate("02"), "02");
  assert.equal(formatPreferredDate("0211"), "02/11");
  assert.equal(formatPreferredDate("02112026"), "02/11/2026");
  assert.equal(formatPreferredDate("02/11/2026"), "02/11/2026");
  assert.equal(formatPreferredDate("021120261234"), "02/11/2026");
  assert.equal(formatPreferredDate("02/11/202"), "02/11/202");
  assert.equal(formatPreferredDate("02/11/"), "02/11");
  assert.equal(dateForApi(formatPreferredDate("02112026")), "2026-11-02");
  assert.throws(() => dateForApi(formatPreferredDate("31022026")), /Data inválida/);
});
