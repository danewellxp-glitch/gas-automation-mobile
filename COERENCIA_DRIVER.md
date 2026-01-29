# Coerência do app com o Driver (gas-automation)

## Resposta direta

| Pergunta | Resposta |
|----------|----------|
| O app mobile está coerente com o app de driver da pasta gas-automation? | **SIM** |
| O app vai conectar ao servidor 192.168.10.156? | **SIM** |
| Todas as funções funcionam igual ao React do outro projeto? | **SIM** (é o mesmo código) |

---

## Por quê

1. **Mesmo código**  
   O que roda no APK é o **build do frontend** em `gas-automation/frontend`.  
   O fluxo é: build em `gas-automation/frontend` → saída em `dist-build/` → cópia para `gas-automation-mobile/dist/` (via `./sync-from-frontend.sh`).  
   Ou seja: **não há outra versão do app**; o mobile usa o mesmo React do projeto gas-automation.

2. **Conexão com 192.168.10.156**  
   - No frontend, a API e o WebSocket usam:
     - `gas-automation/frontend/.env.production`:  
       `VITE_API_URL=http://192.168.10.156:8000/api`,  
       `VITE_WS_URL=ws://192.168.10.156:8000`
     - `gas-automation/frontend/vite.config.js`:  
       `__API_URL__` e `__WS_URL__` apontando para `http://192.168.10.156:8000/api` e `ws://192.168.10.156:8000/ws`
   - O build de produção (`npm run build` no frontend) usa essas variáveis; elas ficam “gravadas” no JS que vai para o APK.
   - Em `gas-automation-mobile/capacitor.config.json`, `server.allowNavigation` inclui `192.168.10.156` e `http://192.168.10.156:8000`, então o WebView do Android permite requisições para esse servidor.

3. **Funções do driver (todas iguais ao React do outro projeto)**  
   As mesmas telas e fluxos do driver no frontend estão no app:

   | Função            | Rota no app        | Arquivo no frontend           |
   |-------------------|--------------------|-------------------------------|
   | Login motorista   | `/driver/login`    | `pages/driver/DriverLogin.jsx` |
   | Dashboard         | `/driver/dashboard`| `pages/driver/DriverDashboard.jsx` |
   | Detalhe entrega   | `/driver/delivery/:id` | `pages/driver/DeliveryDetail.jsx` |
   | Histórico         | `/driver/history`  | `pages/driver/DeliveryHistory.jsx` |
   | Perfil            | `/driver/profile`  | `pages/driver/DriverProfile.jsx` |
   | Acerto de carga  | `/driver/carga/acerto` | `pages/driver/AcertoCarga.jsx` |

   API do driver: `utils/driverApi.js` e `services/api.js` (login, perfil, stats, status, entregas, etc.).  
   Tudo isso entra no mesmo build que é copiado para o mobile.

---

## O que você precisa fazer para manter igual

1. **Sempre que mudar o app do driver no frontend**  
   Rodar na raiz de `gas-automation-mobile`:
   ```bash
   ./sync-from-frontend.sh
   ```
   Isso faz o build no `gas-automation/frontend` e atualiza `gas-automation-mobile/dist/`. Depois, gerar o APK de novo (por exemplo `npx cap sync android` e build no Android Studio).

2. **Se mudar o IP do servidor**  
   Alterar em:
   - `gas-automation/frontend/.env.production` (e, se existir, `.env` usado em produção)
   - `gas-automation/frontend/vite.config.js` (bloco `define`, se ainda usar)
   Depois rodar de novo `./sync-from-frontend.sh` e rebuild do APK.

3. **Celular na mesma rede**  
   O dispositivo precisa estar na mesma rede (ou VPN) que o `192.168.10.156` para a API e o WebSocket funcionarem.

---

## Resumo

- **Coerente com o app de driver da pasta gas-automation?** Sim.  
- **Vai conectar ao 192.168.10.156?** Sim, desde que o build seja feito com o frontend que usa `.env.production` / `vite.config.js` com esse IP.  
- **Todas as funções iguais ao React do outro projeto?** Sim; o app mobile é o mesmo código React do frontend, só empacotado no Capacitor.
