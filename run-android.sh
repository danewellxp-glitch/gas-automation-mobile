#!/bin/bash
# Instala e executa o app no dispositivo/emulador Android.
# Use a partir da raiz do repo: ./run-android.sh
# Para ferramentas (ex.: Gemini): o módulo Android é :app; o projeto fica em android/
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/2] Sincronizando web assets e plugins (cap sync)..."
npx cap sync android

echo "[2/2] Build e instalação no dispositivo (módulo :app)..."
cd android
./gradlew installDebug

echo "OK. App instalado. Abra 'Gas Driver' no dispositivo ou emulador."
echo "Módulo do app: :app  (projeto: android/, rootProject.name: GasDriver)"
