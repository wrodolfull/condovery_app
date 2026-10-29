import assert from "node:assert/strict";
import test from "node:test";
import { ApiClient, ApiError, backendOrigin } from "../src/api";
import { dateForApi } from "../src/domain/date";
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
  assert.ok(
    api.image("/api/media/771e965c-5e32-40aa-b2f1-11cc208260f8", "account")
      ?.headers.Authorization,
  );
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
