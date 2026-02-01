# Prompt para Claude no Cursor - Gas Driver Mobile App

## Contexto do Projeto

App mobile (Ionic React + Capacitor) para motoristas de entrega de gás. Repositório: `gas-automation-mobile`. Backend: `gas-automation` (FastAPI, PostgreSQL, Redis, MinIO, WAHA WhatsApp).

### Stack Mobile
- Ionic 8 + React 18 + TypeScript 5.6
- Capacitor 8 (Android)
- Axios + axios-retry
- React Router v5
- Context API para estado

### Estrutura Atual
```
src/
├── pages/           Dashboard.tsx, DeliveryList.tsx, DeliveryDetail.tsx, Login.tsx
├── services/        api.ts, camera.ts, pushNotifications.ts, locationTracker.ts
├── context/         AuthContext.tsx
├── components/      ErrorBoundary.tsx, NetworkStatus.tsx, EmptyState.tsx, Skeletons.tsx
├── hooks/           useConfirm.ts
├── utils/           storage.ts, network.ts, errorHandler.ts, navigation.ts
└── theme/           variables.css (primary: #10b981 green, secondary: #0f172a dark)
```

### Plugins Capacitor Instalados
- @capacitor/preferences (storage seguro)
- @capacitor/camera (foto de comprovante)
- @capacitor/geolocation (GPS tracking)
- @capacitor/push-notifications (FCM)

### API Base URL
`http://192.168.10.156:8000/api`

### Endpoints Usados
- POST /auth/login
- GET /drivers/me (perfil)
- GET /drivers/me/stats (estatísticas)
- PUT /drivers/me/status (online/offline)
- PUT /drivers/me/location (GPS)
- PUT /drivers/me/push-token (FCM token)
- GET /drivers/me/deliveries?status=active|pending|completed
- PUT /drivers/deliveries/{id}/status (picked_up, in_transit, arrived, delivered, failed)
- POST /drivers/deliveries/{id}/accept
- POST /images/upload (foto comprovante, multipart/form-data)

### Campos da Delivery (retornados pelo backend)
```typescript
{
  id: string               // UUID da delivery
  order_id: string         // UUID do pedido
  order_number: string     // "12", "11" etc
  status: string           // pending, assigned, picked_up, in_transit, arrived, delivered, failed
  bairro: string           // "Centro", "Fanny"
  delivery_address_str: string  // "rua das flores, 1244"
  customer_name: string
  customer_phone: string
  order_total: number      // 150.00
  order_items: [{product_code, product_name, quantity}]
  notes: string
  assigned_at, picked_up_at, in_transit_at, arrived_at, delivered_at: string (ISO)
}
```

---

## TAREFA 1: Melhorar Layout/Design do App

O app está funcional mas com visual muito básico. Precisa de uma reformulação visual completa mantendo a paleta verde (#10b981) e dark (#0f172a).

### O que melhorar:

#### Login
- Card centralizado com logo/nome do app Gasmaster
- Inputs com ícones (email, lock)
- Botão de login com gradiente verde
- Background dark com algum elemento visual

#### Dashboard
- Card de status mais elaborado (gradiente, ícone grande de status)
- Cards de estatísticas com ícones (caminhão, calendario)
- Adicionar card de "próxima entrega" se tiver uma ativa
- Indicador de GPS ativo (ponto verde pulsando)
- Saudação com hora do dia ("Bom dia", "Boa tarde", "Boa noite")

#### Lista de Entregas
- Cards ao invés de lista simples
- Cada card com: número do pedido, endereço, bairro, valor, status colorido
- Ícone de localização no card
- Animação de slide ao aceitar

#### Detalhe da Entrega
- Timeline visual do status (bolinha → linha → bolinha para cada etapa)
- Mapa estático com endereço (Google Static Maps ou similar)
- Seção de itens com quantidade e nome do produto
- Botões de ação maiores e mais claros
- Botão de ligar para cliente mais visível
- Seção de foto do comprovante após entrega

### Diretrizes de Design
- Mobile-first, uso com uma mão
- Fontes grandes e legíveis (motorista no trânsito)
- Botões grandes com área de toque mínima 48px
- Cores de status consistentes: pending=amarelo, assigned=azul, in_transit=roxo, arrived=ciano, delivered=verde, failed=vermelho
- Usar Ionic components (IonCard, IonChip, IonBadge, IonAvatar)
- Skeleton loading em todas as telas
- Pull-to-refresh em todas as listas

---

## TAREFA 2: Sprint 3 - Offline Queue

### Objetivo
Enfileirar ações do motorista quando estiver sem internet e sincronizar quando reconectar.

### O que implementar

#### 1. Criar `src/services/offlineQueue.ts`
```typescript
interface QueuedAction {
  id: string
  type: 'status_update' | 'location_update' | 'accept_delivery'
  endpoint: string
  method: 'PUT' | 'POST'
  payload: any
  createdAt: string
  retries: number
}
```

- Salvar fila no Capacitor Preferences (persiste entre reinícios)
- Quando offline, interceptar chamadas de API e salvar na fila
- Quando online, processar fila FIFO com retry
- Máximo 3 retries por ação, depois descarta

#### 2. Modificar `src/services/api.ts`
- Adicionar interceptor de request que detecta offline
- Se offline e é uma ação de escrita (PUT/POST), salvar na fila ao invés de falhar
- Retornar resposta fake de sucesso para a UI não quebrar

#### 3. Criar cache de entregas
- Ao carregar entregas com sucesso, salvar no Capacitor Preferences
- Se offline, retornar do cache
- Invalidar cache quando sincronizar

#### 4. Modificar `src/components/NetworkStatus.tsx`
- Mostrar badge de "X ações pendentes" quando tem itens na fila
- Ao reconectar, mostrar progresso de sincronização
- Botão de "Sincronizar agora" manual

#### 5. Processar fila na reconexão
- Escutar evento `window.online`
- Processar ações em ordem (FIFO)
- Se servidor retornar 409 (conflito), descartar ação
- Mostrar toast de sucesso/falha

### Arquivos a criar/modificar
- CRIAR: `src/services/offlineQueue.ts`
- MODIFICAR: `src/services/api.ts` (interceptor offline)
- MODIFICAR: `src/components/NetworkStatus.tsx` (badge + sync)
- MODIFICAR: `src/utils/storage.ts` (cache de deliveries)

### Teste
1. Colocar celular em modo avião
2. Mudar status de entrega (deve enfileirar)
3. Tirar modo avião
4. Verificar se ações foram sincronizadas

---

## GPS Auto-Arrived + WhatsApp "1 minuto"
Quando o motorista está em rota e se aproxima do cliente (~500m), o backend:
- Auto-atualiza status para `arrived`
- Envia WhatsApp: "Seu gás está a 1 minuto da sua casa!"
Ver: `docs/guias/GPS_AUTO_ARRIVED_WHATSAPP.md`

## Notas Importantes
- O app usa React Router v5 (não v6)
- Tema está em `src/theme/variables.css`
- Build: `npm run build && npx cap sync android`
- API URL: `http://192.168.10.156:8000/api`
- Backend roda em Docker no Linux (192.168.10.156)
- NUNCA usar `capacitor://localhost` em CORS (crasha o backend)
