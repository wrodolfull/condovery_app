import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

test("login follows the web sequence: email, password, then Google with icon", () => {
  const source = read("src/screens/AuthScreens.tsx");
  const login = source.slice(source.indexOf("export function Login()"), source.indexOf("function LegalLinks()"));
  const email = login.indexOf('label="E-mail"');
  const password = login.indexOf('label="Senha"');
  const primary = login.indexOf('title="Entrar com e-mail"');
  const divider = login.indexOf("<AuthDivider />");
  const google = login.indexOf("<GoogleButton");
  const signup = login.indexOf('action="Cadastre-se"');
  assert.ok(email >= 0 && email < password && password < primary);
  assert.ok(primary < divider && divider < google && google < signup);
  assert.match(login, /auth\.google\(\)/);
});

test("registration offers Google after the form without bypassing condominium validation", () => {
  const source = read("src/screens/AuthScreens.tsx");
  const register = source.slice(source.indexOf("export function Register()"), source.indexOf("export function Recover()"));
  assert.match(register, /public\/condominium/);
  assert.match(register, /auth\.finishSignup/);
  assert.match(register, /Código de convite/);
  assert.match(register, /policy\.valid/);
  const primary = register.indexOf('title="Criar minha conta"');
  const divider = register.indexOf("<AuthDivider />");
  const google = register.indexOf("<GoogleButton");
  assert.ok(primary >= 0 && primary < divider && divider < google);
});

test("shared visual components render Google's four-color icon", () => {
  const visuals = read("src/components/AuthVisuals.tsx");
  assert.match(visuals, /Continuar com Google/);
  for (const color of ["#4285F4", "#34A853", "#FBBC05", "#EA4335"]) {
    assert.ok(visuals.includes(color));
  }
  assert.match(visuals, /ELEVADOOR · TUDO DE BOM MORA AQUI/);
});

test("local Android builds include the Firebase config without committing it", () => {
  const config = read("app.config.ts");
  assert.match(config, /googleServicesFile:/);
  assert.match(config, /existsSync\("\.\/google-services\.json"\)/);
  const gitignore = read(".gitignore");
  const easignore = read(".easignore");
  assert.match(gitignore, /^google-services\.json$/m);
  assert.match(easignore, /^!google-services\.json$/m);
});
