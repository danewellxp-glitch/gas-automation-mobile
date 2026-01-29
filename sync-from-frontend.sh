#!/bin/bash
# Sincroniza o build do frontend (gas-automation/frontend) para este app mobile.
# O APK serve o mesmo app do driver que está no frontend.
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/../gas-automation/frontend"
DIST_DIR="${SCRIPT_DIR}/dist"

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Erro: pasta do frontend não encontrada: $FRONTEND_DIR"
  echo "Execute este script a partir de gas-automation-mobile com gas-automation no mesmo nível."
  exit 1
fi

echo "Building frontend em $FRONTEND_DIR ..."
(cd "$FRONTEND_DIR" && npm run build)

echo "Copiando dist-build para $DIST_DIR ..."
rm -rf "${DIST_DIR:?}"/*
cp -a "$FRONTEND_DIR/dist-build/." "$DIST_DIR/"

echo "OK. dist/ atualizado. Rode 'npx cap sync android' e depois abra no Android Studio se quiser."
exit 0
