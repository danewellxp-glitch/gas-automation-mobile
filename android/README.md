# Gas Driver – projeto Android (Capacitor)

Este diretório é o **projeto Android** do app. Para executar o app:

## Nome do módulo (para ferramentas / Gemini / CLI)

- **Módulo do app:** `:app`
- **Nome do projeto Gradle:** `GasDriver` (definido em `settings.gradle` como `rootProject.name`)
- **Não use:** `gas-automation-mobile` como nome de módulo – o módulo correto é **`:app`**.

## Como executar

### Opção 1: Pela raiz do repositório (recomendado)

Na pasta **gas-automation-mobile** (raiz do repo):

```bash
./run-android.sh
```

Isso faz `cap sync` e depois `./gradlew installDebug` no diretório `android/`.

### Opção 2: Android Studio

1. Abra o **Android Studio**.
2. **File → Open** e selecione a pasta **android** (esta pasta), não a raiz do repo.
3. Aguarde o Gradle sync.
4. Selecione o run configuration **"app"** (módulo `:app`).
5. Escolha dispositivo ou emulador e clique em Run (▶).

### Opção 3: Linha de comando a partir de android/

```bash
# A partir da raiz do repo, primeiro sincronize o Capacitor:
cd /caminho/para/gas-automation-mobile
npx cap sync android

# Depois, a partir da pasta android:
cd android
./gradlew installDebug
```

## Estrutura

- **:app** – aplicativo principal (MainActivity, recursos, usa o conteúdo de `dist/` via Capacitor).
- **:capacitor-android** – runtime Capacitor (incluído por `capacitor.settings.gradle`).
- **:capacitor-cordova-android-plugins** – gerado por `npx cap sync`; não versionado no Git.

Se o build falhar com "capacitor-cordova-android-plugins not found" ou com erros de assets, execute na raiz do repo: `npx cap sync android`. Isso gera `capacitor-cordova-android-plugins` e copia o conteúdo de `dist/` para `app/src/main/assets/public/`.
