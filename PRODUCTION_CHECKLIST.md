# Gas Driver - Checklist de Build para Producao

## Pre-Build

### 1. Configuracao de Ambiente
- [ ] Atualizar `.env.production` com a URL real da API
- [ ] Verificar se `VITE_API_URL` aponta para HTTPS
- [ ] Remover qualquer IP hardcoded

### 2. Seguranca
- [ ] Confirmar que `webContentsDebuggingEnabled: false` em producao
- [ ] Confirmar que `cleartext: false` em producao
- [ ] Confirmar que `allowMixedContent: false` em producao
- [ ] Rodar `npm audit` e corrigir vulnerabilidades criticas

### 3. Codigo
- [ ] Rodar `npm run lint` sem erros
- [ ] Verificar se nao ha `console.log` em codigo de producao
- [ ] Confirmar que todos os tokens sao armazenados via Capacitor Preferences

## Build

### Comandos
```bash
# Build de producao completo
npm run build:prod

# Sync com Android
npm run cap:sync:prod

# Gerar APK de release
npm run cap:build:release
```

### Localizacao do APK
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Assinatura do APK
Para publicar na Play Store, o APK precisa ser assinado:

```bash
# Gerar keystore (apenas uma vez)
keytool -genkey -v -keystore gas-driver.keystore -alias gas-driver -keyalg RSA -keysize 2048 -validity 10000

# Assinar APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore gas-driver.keystore app-release-unsigned.apk gas-driver

# Otimizar com zipalign
zipalign -v 4 app-release-unsigned.apk gas-driver-release.apk
```

## Pos-Build

### Testes Obrigatorios
- [ ] Login funciona
- [ ] Dashboard carrega estatisticas
- [ ] Lista de entregas carrega
- [ ] Aceitar entrega funciona
- [ ] Atualizar status funciona
- [ ] Logout funciona
- [ ] Pull-to-refresh funciona
- [ ] Comportamento offline mostra mensagem adequada

### Dispositivos de Teste
- [ ] Android 10+
- [ ] Tela pequena (< 5")
- [ ] Tela grande (> 6")
- [ ] Conexao 3G/4G

## Melhorias Futuras (Nao Implementadas)

### Prioridade Alta
- Push notifications para novas entregas
- Tracking GPS em tempo real
- Sincronizacao offline (queue de acoes)

### Prioridade Media
- Historico de entregas com busca
- Foto de comprovante de entrega
- Modo escuro

### Prioridade Baixa
- Estatisticas graficas
- Integracao com Waze/Google Maps
- Chat com cliente

---

Ultima atualizacao: Janeiro 2026
