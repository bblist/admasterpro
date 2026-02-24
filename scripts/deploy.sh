#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# AdMaster Pro - Manual Deployment Script
# ═══════════════════════════════════════════════════════════════════
#
# Description:
#   Deploys the latest code from GitHub to the Lightsail production server.
#   Run this from your local machine.
#
# Usage:
#   ./deploy.sh [branch]
#   ./deploy.sh          # Deploys main branch
#   ./deploy.sh feature  # Deploys feature branch
#
# Requirements:
#   - SSH key at ~/.ssh/lightsail-admasterpro.pem
#   - Server at 3.225.249.236
#
# ═══════════════════════════════════════════════════════════════════

set -e

# ─── Configuration ───────────────────────────────────────────────────
BRANCH="${1:-main}"
SERVER="ubuntu@3.225.249.236"
SSH_KEY="$HOME/.ssh/lightsail-admasterpro.pem"
PROJECT_DIR="/home/ubuntu/admasterpro"

# ─── Helpers ─────────────────────────────────────────────────────────
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

error() {
    echo "[ERROR] $1"
    exit 1
}

# ─── Pre-flight Checks ───────────────────────────────────────────────
if [ ! -f "$SSH_KEY" ]; then
    error "SSH key not found: $SSH_KEY"
fi

log "Deploying branch: $BRANCH"
log "Target server: $SERVER"

# ─── Local Build Check ───────────────────────────────────────────────
log "Running local build check..."
npm run build || error "Local build failed. Fix errors before deploying."

# ─── Deploy to Server ────────────────────────────────────────────────
log "Connecting to server..."

ssh -i "$SSH_KEY" "$SERVER" << EOF
    set -e
    cd $PROJECT_DIR
    
    echo "=== Current status ==="
    git status --short
    pm2 status admasterpro
    
    echo ""
    echo "=== Pulling $BRANCH ==="
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
    
    echo ""
    echo "=== Installing dependencies ==="
    npm ci --production=false
    
    echo ""
    echo "=== Generating Prisma client ==="
    npx prisma generate
    
    echo ""
    echo "=== Building application ==="
    pm2 stop admasterpro || true
    NODE_OPTIONS="--max-old-space-size=1024" npm run build
    
    echo ""
    echo "=== Restarting application ==="
    pm2 restart admasterpro
    
    echo ""
    echo "=== Final status ==="
    pm2 status
EOF

# ─── Health Check ────────────────────────────────────────────────────
log "Waiting for server to start..."
sleep 10

log "Running health check..."
HEALTH=$(curl -s https://admasterai.nobleblocks.com/api/health)
echo "$HEALTH" | head -c 200
echo ""

if echo "$HEALTH" | grep -q '"status":"healthy"'; then
    log "✅ Deployment successful!"
else
    log "⚠️ Health check returned unexpected response. Check server logs."
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo " Deployment Complete"
echo "═══════════════════════════════════════════════════════════════"
echo " Branch:  $BRANCH"
echo " Server:  $SERVER"
echo " URL:     https://admasterai.nobleblocks.com"
echo "═══════════════════════════════════════════════════════════════"
