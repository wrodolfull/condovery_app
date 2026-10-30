# Elevadoor App

Aplicativo **Android e iOS** com Expo SDK 57, React Native, Expo Router e TypeScript. A interface do morador foi portada do [Elevadoor web](https://github.com/wrodolfull/condovery), preservando sua identidade visual e consumindo o mesmo backend.

## O que está implementado

- Login por e-mail, cadastro com convite/torre/apartamento, Google com PKCE e sessão nativa no SecureStore.
- Solicitação de recuperação de senha; o link seguro enviado por e-mail conclui a redefinição na web e o usuário retorna ao app para entrar.
- Início, busca na própria página, categorias, ofertas, lojas, produtos, personalizações, favoritos, carrinho e pedidos.
- Barra flutuante compartilhada: Início, Explorar, Salvos, Pedidos e Conta, presente também nas páginas internas.
- Anúncios com selo PUBLICIDADE, localização, ação Ver oferta, paginação e registro de visualização; a arte semanal aparece quando não há anúncios.
- Feiras com capa, datas, listagem e produtos; cards quadrados com selo de oferta e cabeçalho da loja com logo circular sobre a capa.
- Cotação no backend, confirmação de preço alterado, retomada idempotente de uma tentativa e abertura do WhatsApp após persistir o pedido.
- Perfil, foto, exclusão de conta, avaliações, denúncias e ajuda ao morador.
- Feiras publicadas e Desapego conforme habilitação do condomínio.
- Notificações: avisos do condomínio, avisos de lojas seguidas, atualizações de pedidos e novos pedidos para o vendedor. Caixa de avisos e preferências individuais.

Administração, superadmin, edição de produtos e gestão da loja permanecem na web. Um vendedor pode receber o alerta de novo pedido no aparelho; a ação abre o painel no navegador. A credencial do aplicativo não autoriza operações desses painéis.

## Dependência do backend

Este projeto requer a [PR #54 de compatibilidade e push](https://github.com/wrodolfull/condovery/pull/54) em `wrodolfull/condovery`, incluindo a migração `038_mobile_sessions_push.sql`. O backend antigo usa apenas cookies web e não aceita o login nativo deste aplicativo.

No servidor original, após integrar a alteração e fazer backup conforme o processo do projeto:

1. Configure as variáveis descritas em `docs/MOBILE_AND_PUSH.md` do backend.
2. Execute `npm run db:migrate` antes de reiniciar o servidor.
3. Mantenha o mesmo banco, Supabase Auth e bucket privado. Não replique dados nem exponha as credenciais do servidor no app.

## Executar

Requer Node.js 22.13+ ou uma versão LTS compatível com o SDK.

```bash
npm ci
```

Copie `.env.example` para `.env`. Configure `EXPO_PUBLIC_API_URL` com o endereço HTTPS **do backend Elevadoor**, sem `/api` no final. O endereço precisa ser acessível ao telefone; `localhost` no aparelho não aponta para o computador.

```bash
npm start
```

Expo Go pode ser usado para conferir as telas e o fluxo por e-mail quando compatível com o SDK instalado. **Google e push remoto precisam de uma development build**. A prévia web é útil para QA de layout; ela não substitui o site original e não altera a política CORS do backend para permitir acesso entre origens.

## Projeto Expo e development builds

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```

Informe o ID retornado em `EXPO_PUBLIC_EAS_PROJECT_ID` e use o mesmo valor em `EXPO_PROJECT_ID` no backend. Configure também essas variáveis nos ambientes EAS dos perfis usados no build; o arquivo `.env` local não é um substituto para a configuração dos builds remotos.

```bash
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
npx expo start --dev-client
```

O perfil `simulator` gera uma build para o simulador iOS. O perfil `preview` oferece APK Android e distribuição interna iOS, conforme as credenciais da conta. Builds nativas e publicação dependem das contas e credenciais do proprietário; nenhuma build EAS foi enviada por esta implementação.

Identificadores configurados: `com.wrodolfull.condovery` em Android e iOS; esquema de retorno `condovery://auth/callback`.

## Ativar push

1. Configure Firebase/FCM v1 para o aplicativo Android. Forneça `google-services.json` como arquivo privado no EAS e aponte `GOOGLE_SERVICES_FILE` para ele. Não o envie ao Git.
2. Configure as credenciais de push APNs para iOS pelo EAS.
3. Habilite a segurança adicional do serviço de push no projeto Expo e configure o token privado do servidor em `EXPO_ACCESS_TOKEN` no backend.
4. No backend, configure `EXPO_PROJECT_ID` e `PUSH_ENABLED=true`, e execute o worker `npm run push:dispatch` a cada minuto. Detalhes no documento do backend.
5. Instale uma development build em um **aparelho físico**, entre no app e acesse **Conta → Preferências de notificações → Ativar notificações neste aparelho**.

O app não pede permissão de notificação antes da ação do usuário. Dispositivos já autorizados são sincronizados ao entrar e ao voltar ao primeiro plano. O backend deriva o destinatário e condomínio da sessão; nenhum remetente escolhe um token arbitrário.

Na página de uma loja, **Receber avisos desta loja** inscreve o morador nas novidades daquele vendedor. Os avisos do condomínio e as atualizações de pedidos têm controles separados. A permissão do aparelho também precisa estar habilitada.

Os painéis web oferecem os compositores em **Administração → Configurações** e **Painel do vendedor → Configurações**. Publicar um aviso exige ação e confirmação no painel. Nenhuma notificação real foi enviada durante a implementação ou os testes.

## Segurança e comportamento

- Token opaco separado das sessões web, guardado em armazenamento protegido do sistema. Em prévia web, o token fica somente em memória.
- Banco e Storage continuam acessíveis exclusivamente pelo backend. Nunca coloque `DATABASE_URL`, service role ou `EXPO_ACCESS_TOKEN` em `EXPO_PUBLIC_*`.
- Permissões de comprador são verificadas no servidor, inclusive quando a identidade tem papel administrativo na web.
- O condomínio vem da sessão; não há seletor de tenant administrativo no app.
- Fotos privadas recebem autenticação apenas na origem configurada do backend.
- Carrinho e tentativa pendente ficam cifrados e vinculados à conta/condomínio no SecureStore, em fragmentos de tamanho limitado. O servidor sempre recalcula os valores.
- Um timeout ao registrar preserva a mesma chave e o mesmo payload. Retomar a tentativa não gera um segundo pedido com essa chave.
- O fluxo Google retorna um código de uso único e exige o verificador da tentativa; tokens de sessão não são enviados na URL.
- Logout tenta desregistrar notificações no aparelho e revoga a sessão no servidor. Como qualquer operação de rede, a revogação remota depende de conectividade; o conteúdo transacional de push é genérico.
- Push é um canal de aviso, não a fonte de verdade. O app consulta a API ao abrir o aviso. A confirmação de pagamento/pedido continua sendo da loja.

## Verificação

```bash
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo-doctor@latest
npm run export:check
npx playwright install chromium
npm run test:ui
```

Os testes de interface usam a exportação web e uma API simulada exclusivamente em `https://condovery.example`; exporte com esse `EXPO_PUBLIC_API_URL` para executá-los. Eles verificam a barra nas telas internas, busca, favoritos, carrinho, anúncios, feiras, cards e loja em 360, 390 e 430 px. A CI guarda capturas em `mobile-preview-qa`.

A CI verifica tipos, lint, testes, versões do SDK e exportação das três plataformas. Exportar JavaScript/Hermes não equivale a compilar/assinar o aplicativo com EAS nem a testar push físico. Google real, e-mails, imagens do Storage e recebimento em Android/iOS ainda precisam de validação no ambiente configurado do proprietário.

## Referência da interface

Origem inicial: commit web `d68f0feaf94cb5a0dcbd29cbc05dede4315ee13f`. A revisão da vitrine usa `c4241386d7a36966b2f2659104f86ee431bb9aea` como referência para navegação, hero, categorias, publicidade, feiras, produtos e lojas. Coral `#FC6741`, amarelo `#FFCF25`, creme `#F7F5EE`, grafite `#251F18`, Outfit e DM Sans. Artes existentes foram reaproveitadas; não há catálogo fictício ou backend alternativo.

Regras puras de pedidos, pagamento e senhas em `src/domain/` foram portadas do mesmo commit. A fidelidade nativa em aparelhos físicos deve ser comparada tela a tela; diferenças de fonte, teclado e safe area exigem QA próprio de cada plataforma.


## Identidade Elevadoor
O nome exibido ao usuário (incluindo ícone na tela inicial, título do app e mensagens) é **Elevadoor**.
Os identificadores técnicos legados `com.wrodolfull.condovery`, `condovery-app` e
`condovery://auth/callback` são mantidos para preservar atualizações de instalações
existentes e o fluxo OAuth atual. A alteração desses identificadores exige coordenação
com EAS, Supabase Auth e novas builds distribuídas.
