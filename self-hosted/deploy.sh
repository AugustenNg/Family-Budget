#!/bin/bash
# =============================================================================
# CFO Family — Self-Hosted Deploy Script
# Su dung: bash self-hosted/deploy.sh
# =============================================================================

set -e

PROJECT_DIR="/nas_data/augustNg/File/Family Budget"
SELF_HOSTED_DIR="$PROJECT_DIR/self-hosted"

echo "======================================"
echo "  CFO Family — Self-Hosted Deploy"
echo "======================================"

# 1. Copy env production
echo ""
echo "[1/6] Cau hinh environment..."
cp "$SELF_HOSTED_DIR/.env.production" "$PROJECT_DIR/.env.production"
cp "$SELF_HOSTED_DIR/.env.production" "$PROJECT_DIR/.env"

# 2. Install dependencies
echo "[2/6] Cai dat dependencies..."
cd "$PROJECT_DIR"
npm ci --production=false 2>&1 | tail -3

# 3. Generate Prisma client
echo "[3/6] Generate Prisma client..."
npx prisma generate

# 4. Run database migration
echo "[4/6] Chay database migration..."
npx prisma migrate deploy 2>&1 || {
    echo "   Chua co migration, tao tu schema..."
    npx prisma db push --accept-data-loss 2>&1
}

# 5. Seed database (chi lan dau)
echo "[5/6] Seed du lieu mac dinh..."
npx prisma db seed 2>&1 || echo "   Seed da chay truoc do hoac khong co seed script"

# 6. Build production
echo "[6/6] Build production..."
npm run build 2>&1 | tail -5

echo ""
echo "======================================"
echo "  BUILD THANH CONG!"
echo "======================================"
echo ""
echo "Khoi dong server:"
echo "  pm2 start self-hosted/ecosystem.config.js"
echo ""
echo "Xem logs:"
echo "  pm2 logs cfo-family"
echo ""
echo "Truy cap:"
echo "  http://100.105.36.108:3000"
echo "  (Chi qua Tailscale)"
echo ""
