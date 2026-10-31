/** Public URLs shared with the Next.js website; never depend on category IDs.
 * Unknown categories deliberately return null, keeping the existing Lucide icon.
 */
export function getCategoryImagePath(name: string, icon?: string): string | null {
  const normalized = name.trim().toLocaleLowerCase("pt-BR")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const path = (slug: string) => `/categories/${slug}.webp`;

  if (/pizza/.test(normalized)) return path("pizzas");
  if (/sushi|japones/.test(normalized)) return path("sushi");
  if (/acai/.test(normalized)) return path("acai");
  if (/\bpets?\b|animais/.test(normalized)) return path("pets");
  if (/limpeza/.test(normalized)) return path("limpeza");
  if (/salgado/.test(normalized)) return path("salgados");
  if (/padaria/.test(normalized)) return path("padaria");
  if (/sorvete|gelato|ice[ -]?cream/.test(normalized)) return path("sorvetes");
  if (/sobremesa/.test(normalized)) return path("doces");
  if (/bolo/.test(normalized)) return path("bolos");
  if (/doce|brigadeiro/.test(normalized)) return path("doces");
  if (/pao|paes/.test(normalized)) return path("padaria");
  if (/lanch|hamburg/.test(normalized)) return path("lanches");
  if (/restaurante|delivery|refeic|comida|almoco|jantar/.test(normalized)) return path("refeicoes");
  if (/bebida|suco|cafe/.test(normalized)) return path("bebidas");
  if (/mercad|conveniencia|supermerc/.test(normalized)) return path("mercado");
  if (/servic|reparo|manutenc/.test(normalized)) return path("servicos");
  if (/casa|decorac/.test(normalized)) return path("casa-decoracao");
  if (/beleza|cosmet|perfume/.test(normalized)) return path("beleza");

  const byIcon: Record<string, string> = {
    "cake-slice": "bolos", sandwich: "padaria", utensils: "refeicoes",
    coffee: "bebidas", sparkles: "beleza", pizza: "pizzas",
    "ice-cream-cone": "doces", "shopping-basket": "mercado",
    wrench: "servicos", house: "casa-decoracao"
  };
  const slug = icon ? byIcon[icon] : undefined;
  return slug ? path(slug) : null;
}
