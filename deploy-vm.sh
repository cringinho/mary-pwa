#!/usr/bin/env bash
# ==============================================================================
# Nosso Universo (mary-pwa) — Script de Separação e Deploy Isolado na VM
# Mantém o subdomínio mary.pyxie.com.br (porta 3001) 100% independente do bot Pyxie
# ==============================================================================

set -Eeuo pipefail

APP_DIR="${HOME}/mary-pwa"
LEGACY_DIR="${HOME}/kuromi/apps/mary-pwa"
NGINX_AVAILABLE="/etc/nginx/sites-available/mary.pyxie.com.br"
NGINX_ENABLED="/etc/nginx/sites-enabled/mary.pyxie.com.br"

echo "🚀 Iniciando configuração isolada do mary-pwa em ${APP_DIR}..."

# 1. Migração automática caso ainda esteja dentro de ~/kuromi/apps/mary-pwa
if [ ! -d "${APP_DIR}" ] && [ -d "${LEGACY_DIR}" ]; then
  echo "📦 Migrando arquivos de ${LEGACY_DIR} para ${APP_DIR}..."
  mkdir -p "${APP_DIR}"
  cp -a "${LEGACY_DIR}/." "${APP_DIR}/"
  echo "✅ Arquivos copiados com sucesso para ${APP_DIR}."
fi

cd "${APP_DIR}"

# 2. Garantir diretórios de persistência
mkdir -p server/data server/uploads/avatars server/uploads/gallery server/uploads/memories

# 3. Instalar dependências e compilar Front-end
echo "📦 Instalando dependências do servidor e cliente..."
npm install
(cd client && npm install && npm run build)

# 4. Configurar Nginx mantendo o subdomínio mary.pyxie.com.br -> 127.0.0.1:3001
if [ -f "nginx/mary.pyxie.com.br.conf" ] && command -v nginx >/dev/null 2>&1; then
  if [ ! -f "${NGINX_AVAILABLE}" ]; then
    echo "🌐 Instalando configuração do Nginx para mary.pyxie.com.br..."
    sudo cp nginx/mary.pyxie.com.br.conf "${NGINX_AVAILABLE}"
    sudo ln -sf "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
    sudo nginx -t && sudo systemctl reload nginx
  else
    echo "ℹ️ Configuração Nginx (${NGINX_AVAILABLE}) já existente (mantendo SSL/Certbot atual)."
  fi
fi

# 5. Atualizar PM2 para rodar a partir do diretório independente ~/mary-pwa na porta 3001
echo "⚡ Reiniciando processo isolado 'mary-pwa' no PM2 (Porta 3001)..."
pm2 delete mary-pwa 2>/dev/null || true
pm2 start ecosystem.config.cjs --update-env
pm2 save

echo "✅ mary-pwa rodando de forma 100% independente em ${APP_DIR} (Porta 3001 -> https://mary.pyxie.com.br)!"

