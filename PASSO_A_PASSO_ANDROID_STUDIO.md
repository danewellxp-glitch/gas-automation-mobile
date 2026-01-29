# Passo a passo: rodar o app no Android Studio para testar

## 1. Commit (recomendado antes de testar)

Se você alterou algo no projeto e quer salvar no GitHub:

```bash
cd /home/daniel/gas-automation-mobile

# Ver o que mudou
git status

# Adicionar os arquivos que quer commitar
git add .

# Commitar (use /usr/bin/git se o "git" normal der erro de trailer)
/usr/bin/git commit -m "Sua mensagem descrevendo a alteração"

# Enviar para o GitHub (só se quiser que outras máquinas vejam)
git push origin main
```

**Não é obrigatório** commitar para rodar no Android Studio no mesmo PC. Só é necessário se você quiser guardar as alterações ou sincronizar com outro computador.

---

## 2. Puxar atualizações do GitHub (se outro PC commitou)

Se você usa mais de um PC ou alguém commitou no repositório:

```bash
cd /home/daniel/gas-automation-mobile
git pull origin main
```

---

## 3. Sincronizar o Capacitor (obrigatório antes de abrir no Android Studio)

O Android Studio precisa dos assets web e dos plugins. Rode **na raiz** do projeto (gas-automation-mobile):

```bash
cd /home/daniel/gas-automation-mobile
npx cap sync android
```

Isso:
- Copia o conteúdo de `dist/` para `android/app/src/main/assets/public/`
- Gera/atualiza a pasta `android/capacitor-cordova-android-plugins/`

**Se você mudou o frontend (gas-automation/frontend)** e quer ver no app, antes rode:
```bash
./sync-from-frontend.sh
```
e depois o `npx cap sync android` (ou o script já faz o sync).

---

## 4. Abrir o projeto no Android Studio

1. Abra o **Android Studio**.
2. **File → Open** (ou “Open an Existing Project”).
3. Selecione **só a pasta `android`**:
   ```
   gas-automation-mobile/android
   ```
   Não abra a pasta `gas-automation-mobile` (raiz); abra **`android`**.
4. Clique em **OK**.
5. Aguarde o **Gradle Sync** terminar (barra de progresso embaixo). Pode demorar na primeira vez.

---

## 5. Conectar dispositivo ou emulador

**Dispositivo físico (recomendado para testar):**
- Conecte o celular por USB.
- Ative **Depuração USB** nas opções de desenvolvedor do Android.
- O dispositivo deve aparecer no canto superior do Android Studio (dropdown de dispositivos).

**Emulador:**
- **Tools → Device Manager** (ou ícone de celular).
- Crie um AVD (Android Virtual Device) se não tiver.
- Inicie o emulador e escolha-o no dropdown.

---

## 6. Rodar o app

1. No dropdown de dispositivos (topo), selecione o dispositivo ou emulador.
2. Confirme que a **run configuration** é **“app”** (módulo `:app`).
3. Clique no botão **Run** (▶) ou use **Run → Run 'app'** (ou Shift+F10).

O app será instalado e aberto no dispositivo/emulador.

---

## Resumo rápido

| Ordem | O que fazer | Onde |
|-------|-------------|------|
| 1 | (Opcional) Commit e push | Terminal na raiz `gas-automation-mobile` |
| 2 | (Opcional) `git pull` | Terminal na raiz |
| 3 | **`npx cap sync android`** | Terminal na raiz |
| 4 | Abrir pasta **`android`** | Android Studio → File → Open |
| 5 | Conectar dispositivo ou emulador | USB ou Device Manager |
| 6 | Run **“app”** (▶) | Android Studio |

---

## Problemas comuns

- **“capacitor-cordova-android-plugins not found”**  
  Rode na raiz: `npx cap sync android`.

- **Tela branca no app**  
  Verifique se existe `dist/index.html` e se você rodou `npx cap sync android`. Se mudou o frontend, rode `./sync-from-frontend.sh` e depois `npx cap sync android`.

- **App não conecta ao servidor**  
  Celular e o PC onde está o backend (192.168.10.156) precisam estar na **mesma rede Wi‑Fi** (ou VPN). No celular, não use “dados móveis” para acessar 192.168.10.156.

- **Gradle sync falhou**  
  Confirme que abriu a pasta **`android`**, não a raiz. E que tem **JDK** instalado (Android Studio costuma trazer um embutido).
