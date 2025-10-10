#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Checking prerequisites..."
command -v docker >/dev/null || { echo "Docker is required"; exit 1; }
command -v docker compose >/dev/null || { echo "docker compose is required"; exit 1; }
command -v node >/dev/null || { echo "Node.js is required"; exit 1; }
command -v npm  >/dev/null || { echo "npm is required"; exit 1; }

echo "==> Starting PostgreSQL (docker compose up -d)"
cd "$ROOT_DIR/server"
docker compose up -d
cd "$ROOT_DIR"

echo "==> Setting up SERVER dependencies"
cd "$ROOT_DIR/server"

rm -rf node_modules package-lock.json || true
npm i -D prisma@5.22.0
npm i @prisma/client@5.22.0
npm i

if [ ! -f ".env" ]; then
  cat > .env <<EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/filemanager?schema=public"
PORT=4000
JWT_SECRET="devsecret"
STATIC_DIR="./static"
EOF
  echo "==> Created server/.env"
fi

echo "==> Prisma generate & migrate"
npx prisma generate
npx prisma migrate deploy

echo "==> Dev tools (tsx, typescript, @types/node)"
npm i -D tsx typescript @types/node

echo "==> Seeding database (if applicable)"
npx tsx src/prisma/seed.ts || echo "(seed skipped or completed)"

echo "==> Setting up CLIENT"
cd "$ROOT_DIR/client"

if [ ! -f ".env" ]; then
  echo 'VITE_API_BASE=http://localhost:4000' > .env
  echo "==> Created client/.env"
fi

npm i
npm i -D @types/node

echo "==> Launching server & client concurrently"
cd "$ROOT_DIR"
npx concurrently -n server,client -c blue,green \
  "npm run dev --prefix server" \
  "npm run dev --prefix client"