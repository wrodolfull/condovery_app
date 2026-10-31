import test from "node:test";
import assert from "node:assert/strict";
import { getCategoryImagePath } from "../src/domain/category-artwork";

test("category names map to hosted WebP files regardless of accent and case", () => {
  assert.equal(getCategoryImagePath("Bolos e doces", "cake-slice"), "/categories/bolos.webp");
  assert.equal(getCategoryImagePath("Pães e salgados", "sandwich"), "/categories/padaria.webp");
  assert.equal(getCategoryImagePath("Refeições"), "/categories/refeicoes.webp");
  assert.equal(getCategoryImagePath("Açaí"), "/categories/acai.webp");
  assert.equal(getCategoryImagePath("Sorvetes"), "/categories/sorvetes.webp");
  assert.equal(getCategoryImagePath("Sobremesas e sorvetes", "ice-cream-cone"), "/categories/sorvetes.webp");
  assert.equal(getCategoryImagePath("Sobremesas"), "/categories/doces.webp");
  assert.equal(getCategoryImagePath("Pizza"), "/categories/pizzas.webp");
  assert.equal(getCategoryImagePath("Mercadinho"), "/categories/mercado.webp");
  assert.equal(getCategoryImagePath("Casa e decoração"), "/categories/casa-decoracao.webp");
});
test("unknown and no-image categories keep the icon fallback", () => {
  assert.equal(getCategoryImagePath("Desapego", "gift"), "/categories/desapego.webp");
  assert.equal(getCategoryImagePath("Moda", "shirt"), "/categories/moda.webp");
  assert.equal(getCategoryImagePath("Nova categoria", "shopping-bag"), null);
  assert.equal(getCategoryImagePath("Outra comida", "utensils"), "/categories/refeicoes.webp");
});

test("disabled and additional categories have their own WebP images",()=>{
  for(const [name,slug] of [
    ["Presentes","presentes"],["Outros","outros"],
    ["Saúde e bem-estar","saude"],["Eletrônicos","eletronicos"],
    ["Beleza","beleza"],["Serviços","servicos"],["Limpeza","limpeza"],
    ["Pets","pets"],["Sushi","sushi"],["Açaí","acai"]
  ]) assert.equal(getCategoryImagePath(name),'/categories/'+slug+'.webp',name);
});
