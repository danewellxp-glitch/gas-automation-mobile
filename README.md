# Gas Driver (gas-automation-mobile)

App mobile **Ionic React + Vite + Capacitor + TypeScript** do motorista (driver) do **Gas Automation**. Integração 100% com o backend real em `gas-automation` (servidor 192.168.10.156).

## Stack

- **Ionic React** – UI e navegação
- **Vite** – build
- **Capacitor** – Android (APK/AAB)
- **TypeScript**
- **Axios** – HTTP + interceptors (JWT)
- **Variáveis de ambiente** – `.env` / `.env.example`

## Estrutura do projeto

```
gas-automation-mobile/
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── theme/
│   │   └── variables.css
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   └── api.ts          # API real + JWT
│   └── pages/
│       ├── Login.tsx
│       ├── Dashboard.tsx
│       ├── DeliveryList.tsx
│       └── DeliveryDetail.tsx
├── vite.config.ts
├── capacitor.config.ts
├── tsconfig.json
├── .env.example
└── android/                 # Projeto Capacitor Android
```

## Backend (gas-automation)

- **Servidor:** `http://192.168.10.156:8000` (API em `/api`)
- **Autenticação:** `POST /api/auth/login` (email, password) → JWT
- **Driver:** `GET /api/drivers/me`, `GET /api/drivers/me/stats`, `PUT /api/drivers/me/status`
- **Entregas:** `GET /api/drivers/me/deliveries`, `PUT /api/drivers/deliveries/:id/status`, `POST /api/drivers/deliveries/:id/accept`

O celular precisa estar na **mesma rede** (ou VPN) que o 192.168.10.156.

## Setup

### 1. Variáveis de ambiente

```bash
cp .env.example .env
# Edite .env se o IP do servidor for diferente de 192.168.10.156
```

### 2. Dependências

```bash
npm install
```

### 3. Build e Android

```bash
npm run build
npx cap sync android
npx cap open android
```

Ou em um comando (após o primeiro `npm run build`):

```bash
./run-android.sh
```

## Scripts

| Comando | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção (TypeScript + Vite) |
| `npm run cap:sync` | Build + `cap sync android` |
| `npm run cap:android` | Roda o app no dispositivo/emulador |
| `npm run cap:open:android` | Abre o projeto no Android Studio |

## Funcionalidades do driver

- **Login** – e-mail/senha, JWT, validação de role `driver`
- **Dashboard** – estatísticas (hoje/semana), status (disponível/offline)
- **Lista de entregas** – filtro ativas / pendentes / concluídas, aceitar entrega
- **Detalhe da entrega** – atualizar status (retirada, em rota, chegou, entregue, falha)

Nada mockado; todas as chamadas vão para a API real em 192.168.10.156.

## Repositório

- **GitHub:** https://github.com/danewellxp-glitch/gas-automation-mobile

## Ionic Appflow

- No Appflow o app deve ser do tipo **Capacitor** (não React Native).
- Em `appflow.config.json` troque `YOUR_APPFLOW_APP_ID` pelo ID do app.
- O build usa `npm run build` e `webDir: dist`.
