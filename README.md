# Gas Driver (gas-automation-mobile)

App mobile Ionic/Capacitor para Gas Automation.

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

## Scripts

| Comando | Descrição |
|--------|-----------|
| `npm run build` | Build do web app (Vite) |
| `npm run cap:sync` | Sincroniza web assets com o projeto Android |
| `npm run cap:open:android` | Abre o projeto no Android Studio |
| `npm run android` | Roda o app no dispositivo/emulador |
