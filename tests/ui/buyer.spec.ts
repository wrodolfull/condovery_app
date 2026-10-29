import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

// Local export and synthetic API fixtures only; no production backend is contacted.
let server: Server;
let origin: string;
const dist = path.resolve("dist");
test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url!, "http://localhost").pathname,
      );
      let file = path.resolve(dist, "." + pathname);
      if (file !== dist && !file.startsWith(dist + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      try {
        if (!(await stat(file)).isFile()) file = path.join(dist, "index.html");
      } catch {
        file = path.join(dist, "index.html");
      }
      const mime: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".png": "image/png",
        ".ttf": "font/ttf",
        ".woff2": "font/woff2",
        ".svg": "image/svg+xml",
      };
      res.setHeader(
        "Content-Type",
        mime[path.extname(file)] ?? "application/octet-stream",
      );
      res.end(await readFile(file));
    } catch {
      res.writeHead(500).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw Error("Preview did not start");
  origin = "http://127.0.0.1:" + address.port;
});
test.afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
});

const id = (digit: number) =>
  `${digit}`.repeat(8) + "-2222-4333-8444-555555555555";
const shop = {
  id: id(2),
  slug: "loja-do-vizinho",
  name: "Loja do Vizinho",
  description: "Feito aqui, pertinho de você.",
  cover_image: "/api/media/" + id(7),
  logo_image: "/api/media/" + id(8),
  is_open: true,
  delivery_enabled: true,
  pickup_enabled: true,
  delivery_fee_cents: 500,
  lead_time: "Combine com a loja",
  payment_methods: ["pix", "cash"],
};
const products = [
  {
    id: id(3),
    shop_id: shop.id,
    shop_name: shop.name,
    category_id: id(4),
    name: "Bolo de cenoura",
    description: "Preparado pelo vizinho.",
    image_url: "/api/media/" + id(9),
    price_cents: 2500,
    promo_price_cents: 2000,
    stock: 10,
    visibility: "available",
    is_featured: true,
    option_groups: [],
  },
  {
    id: id(5),
    shop_id: shop.id,
    shop_name: shop.name,
    category_id: id(4),
    name: "Cesta esgotada",
    description: "Produto sem estoque.",
    image_url: null,
    price_cents: 5000,
    promo_price_cents: null,
    stock: 0,
    visibility: "available",
    option_groups: [],
  },
];
const fair = {
  id: id(6),
  title: "Feira da vizinhança",
  description: "Sabores e presentes dos moradores.",
  cover_image_url: "/api/media/" + id(7),
  starts_at: "2026-10-29T12:00:00Z",
  ends_at: "2026-11-30T18:00:00Z",
};
const campaigns = [0, 1].map((i) => ({
  id: `ad-${i}`,
  merchant_name: `Comércio ${i + 1}`,
  headline: `Oferta da vizinhança ${i + 1}`,
  description: "Produtos e serviços pertinho de casa.",
  location: "Rua das Flores, 10",
  image_url: "/api/media/" + id(7),
  destination_url: "https://merchant.example/oferta",
}));
const navLabels = ["Início", "Explorar", "Salvos", "Pedidos", "Conta"];

async function enter(page: Page, withAds = true) {
  const errors: string[] = [],
    impressions: string[] = [];
  let favoriteIds: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const image = await readFile("assets/icon.png");
  await page.route("https://condovery.example/api/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      endpoint = url.pathname.slice(5);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    if (endpoint.startsWith("media/")) {
      await route.fulfill({ body: image, contentType: "image/png", headers });
      return;
    }
    let value: unknown;
    if (endpoint === "mobile/config") value = { version: 1, google: false };
    else if (endpoint === "mobile/auth/login")
      value = { access_token: "a".repeat(64) };
    else if (endpoint === "me")
      value = {
        viewer: {
          id: id(1),
          condominium_id: id(4),
          name: "Morador Teste",
          email: "teste@example.com",
          phone: "11999991234",
          tower: "Torre A",
          apartment: "101",
          towers: ["Torre A"],
          condominium_name: "Condomínio de Teste",
          avatar_image: null,
          status: "approved",
          role: "resident",
        },
      };
    else if (endpoint === "home")
      value = {
        categories: [{ id: id(4), name: "Bolos e doces", icon: "cake-slice" }],
        shops: [shop],
        products,
      };
    else if (endpoint === "favorites" && request.method() === "POST") {
      favoriteIds.push(request.postDataJSON().product_id);
      value = { ok: true };
    } else if (endpoint.startsWith("favorites/")) {
      favoriteIds = favoriteIds.filter((id) => id !== endpoint.split("/")[1]);
      value = { ok: true };
    } else if (endpoint === "favorites")
      value = {
        ids: favoriteIds,
        products: products.filter((p) => favoriteIds.includes(p.id)),
      };
    else if (endpoint === "ads")
      value = { campaigns: withAds ? campaigns : [] };
    else if (/^ads\/[^/]+\/impression$/.test(endpoint)) {
      impressions.push(endpoint);
      value = { ok: true };
    } else if (endpoint === "fairs") value = { fairs: [fair] };
    else if (endpoint === "fairs/" + fair.id) value = { fair, products };
    else if (endpoint === "catalog")
      value = {
        products: products.filter((p) =>
          p.name
            .toLowerCase()
            .includes((url.searchParams.get("search") ?? "").toLowerCase()),
        ),
        hasMore: false,
      };
    else if (endpoint === "shops/" + shop.id) value = { shop, products };
    else if (endpoint.endsWith("/reviews"))
      value = {
        summary: { average: 5, count: 1 },
        reviews: [
          {
            id: "review",
            rating: 5,
            description: "Compra excelente!",
            created_at: "2026-10-29T12:00:00Z",
          },
        ],
      };
    else if (endpoint.startsWith("push/shops/")) value = { subscribed: false };
    else if (endpoint === "orders") value = { orders: [] };
    else if (endpoint === "push/inbox")
      value = { notifications: [], hasMore: false };
    else if (endpoint === "push/preferences")
      value = {
        preferences: { condominium: true, orders: true, seller_orders: true },
        is_seller: false,
      };
    else
      throw Error(
        "Unexpected fixture endpoint: " + request.method() + " " + endpoint,
      );
    await route.fulfill({ json: value, headers });
  });
  await page.goto(origin);
  await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("Password123!");
  await page.getByText("Entrar com e-mail", { exact: true }).click();
  await expect(
    page.getByText("Seu condomínio mais perto de você!", { exact: true }),
  ).toBeVisible();
  return { errors, impressions };
}
async function checkNav(page: Page, selected?: string) {
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(5);
  for (let i = 0; i < navLabels.length; i++) {
    await expect(tabs.nth(i)).toHaveAccessibleName(navLabels[i]);
    await expect(tabs.nth(i)).toHaveAttribute(
      "aria-selected",
      String(navLabels[i] === selected),
    );
    const rect = await tabs.nth(i).boundingBox();
    expect(rect).toBeTruthy();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

for (const width of [360, 390, 430]) {
  test(`buyer navigation, cards and store remain usable at ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 844 });
    const { errors } = await enter(page);
    await checkNav(page, "Início");
    await page.screenshot({ path: info.outputPath("home.png") });
    const product = page
      .getByRole("button", { name: "Ver Bolo de cenoura", exact: true })
      .last();
    await product.scrollIntoViewIfNeeded();
    const photo = product.getByLabel("Bolo de cenoura", { exact: true });
    const rect = await photo.boundingBox();
    expect(rect).toBeTruthy();
    expect(Math.abs(rect!.width - rect!.height)).toBeLessThan(1);
    await expect(product.getByText("Oferta", { exact: true })).toBeVisible();
    await expect(page.getByText("Esgotado", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Salvar nos favoritos", exact: true }).first().click();
    await product.click();
    await expect(
      page.getByText("Preparado pelo vizinho.", { exact: true }),
    ).toBeVisible();
    await checkNav(page);
    await page.getByText("Adicionar ao carrinho", { exact: false }).click();
    await expect(
      page.getByText("Seu pedido · Loja do Vizinho", { exact: true }),
    ).toBeVisible();
    await checkNav(page);
    // The nav must work directly from a pushed checkout screen.
    await page.getByRole("tab", { name: "Explorar", exact: true }).click();
    await expect(
      page.getByLabel("Buscar produtos ou lojas").filter({ visible: true }),
    ).toBeVisible();
    await checkNav(page, "Explorar");
    await page
      .getByRole("button", { name: "Ver loja Loja do Vizinho", exact: true })
      .filter({ visible: true })
      .click();
    await expect(
      page.getByText("Produtos da loja", { exact: true }),
    ).toBeVisible();
    await checkNav(page);
    await page.screenshot({ path: info.outputPath("store.png") });
    await expect(
      page.getByText("Compra verificada · Morador do condomínio", {
        exact: true,
      }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Salvos", exact: true }).click();
    await checkNav(page, "Salvos");
    await expect(page.getByRole("button", { name: "Ver Bolo de cenoura", exact: true }).filter({ visible: true })).toHaveCount(1);
    await page.getByRole("button", { name: "Remover dos favoritos", exact: true }).filter({ visible: true }).click();
    await expect(page.getByText("Seu próximo favorito mora aqui", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Pedidos", exact: true }).click();
    await checkNav(page, "Pedidos");
    await page.getByRole("tab", { name: "Conta", exact: true }).click();
    await checkNav(page, "Conta");
    expect(errors).toEqual([]);
  });
}

test("ads, fairs and inline home search use the same marketplace structure", async ({
  page,
}, info) => {
  const { errors, impressions } = await enter(page);
  expect(impressions).toEqual([]); // offscreen ads are not counted on mount
  const adHeading = page.getByText("Ofertas perto de você", { exact: true });
  await adHeading.scrollIntoViewIfNeeded();
  await expect(page.getByText("PUBLICIDADE", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Rua das Flores, 10", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => impressions.filter((p) => p.includes("ad-0")).length)
    .toBe(1);
  await page.getByRole("button", { name: "Anúncio 2", exact: true }).click();
  await expect(
    page.getByText("Oferta da vizinhança 2", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Ofertas da semana", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("advertisement.png") });
  await page.getByRole("button", { name: "Anúncio 1", exact: true }).click();
  await expect(
    page.getByText("Oferta da vizinhança 1", { exact: true }),
  ).toBeVisible();
  expect(impressions.filter((p) => p.includes("ad-0"))).toHaveLength(1);
  await page.getByRole("button", { name: "Ver feiras", exact: true }).click();
  await expect(
    page.getByText("Feiras do condomínio", { exact: true }),
  ).toBeVisible();
  await checkNav(page);
  await page
    .getByRole("button", { name: "Explorar feira", exact: true })
    .click();
  await expect(
    page
      .getByText("Sabores e presentes dos moradores.", { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByText(/29\/10\/2026.+30\/11\/2026/)).toBeVisible();
  await checkNav(page);
  await page.screenshot({ path: info.outputPath("fair.png") });
  await page.getByRole("tab", { name: "Início", exact: true }).click();
  const search = page
    .getByLabel("Buscar produtos ou lojas")
    .filter({ visible: true });
  await search.fill("Bolo");
  await expect(
    page.getByText("Resultados da busca", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: "Ver Bolo de cenoura", exact: true })
      .filter({ visible: true }),
  ).toHaveCount(1);
  await expect(
    page.getByText("PUBLICIDADE", { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Limpar busca", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Começar a explorar", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("the weekly offer artwork is the fallback when there are no ads", async ({
  page,
}, info) => {
  const { errors } = await enter(page, false);
  await expect(
    page.getByText("Ofertas da semana", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Ofertas perto de você", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Conferir agora", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("weekly-offer.png") });
  await page
    .getByRole("button", { name: "Conferir agora", exact: true })
    .click();
  await checkNav(page, "Explorar");
  expect(errors).toEqual([]);
});
