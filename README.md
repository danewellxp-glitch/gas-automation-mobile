# Gas Driver (gas-automation-mobile)

App mobile Ionic/Capacitor para **Gas Automation** – é o app do **motorista (driver)** do mesmo sistema.

## Relação com gas-automation

O conteúdo do APK (telas de login do motorista, dashboard, entregas, mapa, etc.) vem do **frontend** do projeto **gas-automation**:

- **Código-fonte do app (driver):** `gas-automation/frontend/src/`
  - Login motorista: `pages/driver/DriverLogin.jsx`
  - Dashboard: `pages/driver/DriverDashboard.jsx`
  - Detalhe entrega: `pages/driver/DeliveryDetail.jsx`
  - Histórico: `pages/driver/DeliveryHistory.jsx`
  - Perfil: `pages/driver/DriverProfile.jsx`
  - Acerto de carga: `pages/driver/AcertoCarga.jsx`
- **API:** o frontend usa `VITE_API_URL` (em produção: `http://192.168.10.156:8000/api`). O APK precisa alcançar esse mesmo backend na rede (Wi‑Fi ou VPN).
- **Build:** o que o APK abre é o build do frontend. A pasta `dist/` aqui deve ser preenchida a partir de `gas-automation/frontend` (veja abaixo).

### Atualizar o APK com o último frontend

```bash
./sync-from-frontend.sh
npx cap sync android
```

Ou manualmente: na pasta `gas-automation/frontend` rode `npm run build`, depois copie o conteúdo de `dist-build/` para `gas-automation-mobile/dist/`.

## Repositório

- **GitHub:** https://github.com/danewellxp-glitch/gas-automation-mobile

## Setup

### 1. Dependências

```bash
npm install
```

### 2. Login na conta Ionic

No seu terminal (interativo, com navegador disponível):

```bash
ionic login
```

Ou use um **Personal Access Token** do [Ionic Dashboard](https://dashboard.ionicframework.com):

```bash
export IONIC_TOKEN=seu_token_aqui
```

### 3. Build e Android

```bash
npm run build
npx cap sync android
npx cap open android
```

## Ionic Appflow (build na nuvem)

1. **Tipo do app:** No Appflow o app precisa ser **Capacitor**, não React Native.  
   Se você criou como "React Native", crie um novo app em [Appflow](https://dashboard.ionicframework.com) como **Capacitor** e conecte este repositório.

2. **App ID:** No `appflow.config.json` troque `YOUR_APPFLOW_APP_ID` pelo ID do app (visível na página do app no Appflow).

3. O `package-lock.json` está atualizado para o runner usar `npm ci` sem erros de dependências opcionais.

## Por que o app não abria / tela branca

A pasta `dist/` **precisava ter um `index.html`** que carrega o app. Só havia arquivos em `assets/`, então o Capacitor não encontrava a página inicial. Agora `dist/` é preenchido com o build do frontend (index.html + assets). Sempre que atualizar o frontend do driver, rode `./sync-from-frontend.sh` e depois `npx cap sync android`.

## Executar o app no Android (Gemini / ferramentas / CLI)

- **Módulo do app:** `:app` (não use `gas-automation-mobile` como nome de módulo).
- **Projeto Gradle:** pasta `android/`; nome do projeto: `GasDriver` (em `android/settings.gradle`).
- **Para implantar:** execute a partir da **pasta `android/`** (não da raiz do repo), ou use o script abaixo.

**Um comando (raiz do repo):**
```bash
./run-android.sh
```
Isso faz `npx cap sync android` e depois `./gradlew installDebug` em `android/`. O APK é instalado no dispositivo/emulador conectado.

**Se uma ferramenta (ex.: Gemini) não encontrar o módulo:** abra o diretório **`android/`** como projeto (não a raiz) e use o módulo **`:app`** para executar.

**Antes de abrir no Android Studio pela primeira vez (ou após clonar o repo):** rode na raiz do repo `npx cap sync android` para gerar `capacitor-cordova-android-plugins` e copiar o conteúdo de `dist/` para `android/app/src/main/assets/public/`. Ou use `./run-android.sh`, que já faz o sync antes do build.

## Scripts

| Comando | Descrição |
|--------|-----------|
| `./run-android.sh` | Cap sync + build e instala o app no dispositivo (módulo :app) |
| `./sync-from-frontend.sh` | Build do frontend (gas-automation) e copia para `dist/` |
| `npm run cap:sync` | Sincroniza `dist/` com o projeto Android |
| `npm run cap:open:android` | Abre o projeto no Android Studio |
| `npm run android` | Roda o app no dispositivo/emulador |

**Nota:** O código do app (driver) está em `gas-automation/frontend`. Este repositório tem o shell Android (Capacitor) e a pasta `dist/` com o build. Use `sync-from-frontend.sh` para atualizar `dist/` a partir do frontend.

### API / Backend

O app do motorista fala com o backend do **gas-automation** em `http://192.168.10.156:8000` (API em `/api`, WebSocket em `/ws`). Isso está em `capacitor.config.json` em `server.allowNavigation`. O celular precisa estar na mesma rede (ou VPN) que esse IP. Para mudar o servidor, altere no frontend: `gas-automation/frontend/.env.production` (e/ou `vite.config.js`), rode o build de novo e `./sync-from-frontend.sh`.
