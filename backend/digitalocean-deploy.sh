#!/bin/bash

# Agent-Arena Complete DigitalOcean Deployment Script
# Copy-paste bu tüm komut satırını DigitalOcean'da çalıştır

set -e

echo "🚀 Agent-Arena Backend - Complete DigitalOcean Deployment"
echo "=========================================================="

# ADIM 1: Repository Setup
echo -e "\n📦 ADIM 1: Repository Setup..."
cd /root
if [ ! -d "agent-arena" ]; then
    echo "Cloning repository..."
    git clone https://github.com/yourusername/agent-arena.git
else
    echo "Repository already exists, pulling latest..."
    cd agent-arena && git pull && cd /root
fi

# ADIM 2: Community Files Kontrol ve İndir
echo -e "\n📥 ADIM 2: Community Files Kontrol..."
COMMUNITY_DIR="/root/agent-arena/backend/agents/community"
mkdir -p "$COMMUNITY_DIR"

# Community routers kontrol et veya indir
declare -a COMMUNITY_FILES=(
    "router.py"
    "threads_router.py"
    "comments_router.py"
    "moderation_router.py"
    "__init__.py"
)

GITHUB_BASE="https://raw.githubusercontent.com/yourusername/agent-arena/main/backend/agents/community"

for file in "${COMMUNITY_FILES[@]}"; do
    filepath="$COMMUNITY_DIR/$file"
    if [ ! -f "$filepath" ]; then
        echo "📥 Downloading $file..."
        curl -s "$GITHUB_BASE/$file" -o "$filepath"
        if [ $? -eq 0 ]; then
            echo "✅ $file indirildi"
        else
            echo "⚠️  $file indirilemedi (lokal sürüm var mı kontrol et)"
        fi
    else
        echo "✅ $file zaten mevcut"
    fi
done

# ADIM 3: Backend Dizinine git
echo -e "\n📂 ADIM 3: Backend Dizinine Git..."
cd /root/agent-arena/backend

# ADIM 4: Virtual Environment
echo -e "\n🐍 ADIM 4: Python Virtual Environment Kurulumu..."
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    echo "✅ Virtual environment oluşturuldu"
else
    echo "✅ Virtual environment zaten mevcut"
fi

# Activate venv
source .venv/bin/activate
echo "✅ Virtual environment aktive edildi"

# ADIM 5: Dependencies Reinstall
echo -e "\n📚 ADIM 5: Dependencies Kurma..."
pip install --upgrade pip --quiet
pip install --no-cache-dir -r requirements_minimal.txt --quiet
echo "✅ Tüm dependencies kuruldu"

# ADIM 6: .env Dosyası Oluştur (opsiyonel)
echo -e "\n⚙️  ADIM 6: Environment Setup..."
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'ENVEOF'
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRATION_MINUTES=30

# Supabase Configuration (if using)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=noreply@agentarena.me
EMAIL_PASSWORD=

# Database (if local)
DATABASE_URL=postgresql://user:password@localhost:5432/agent_arena
ENVEOF
    echo "✅ .env dosyası oluşturuldu (değerleri düzenle!)"
    echo "⚠️  Dosyayı düzenlemek için: nano .env"
else
    echo "✅ .env dosyası zaten mevcut"
fi

# ADIM 7: Logs Dizini
echo -e "\n📝 ADIM 7: Logs Dizini..."
mkdir -p /root/logs
echo "✅ Logs dizini hazır"

# ADIM 8: Test
echo -e "\n🧪 ADIM 8: Test Çalıştırma..."
export PYTHONPATH=/root/agent-arena:/root/agent-arena/backend

echo "Testing FastAPI import..."
python3 -c "from main import app; print('✅ FastAPI app loaded successfully')" && {
    echo "✅ Import başarılı!"
} || {
    echo "❌ Import hatası - logları kontrol et"
    exit 1
}

# ADIM 9: Backend Başlat
echo -e "\n🚀 ADIM 9: Backend Başlatılıyor..."
echo "Starting uvicorn on port 10000..."

# Kill existing process
pkill -f "uvicorn main:app" 2>/dev/null || true
sleep 1

# Start new process
mkdir -p /root/logs
nohup env PYTHONPATH=/root/agent-arena:/root/agent-arena/backend python3 -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 10000 \
    --reload \
    > /root/logs/uvicorn.log 2>&1 &

echo $! > /root/agent-arena/backend/.pid
sleep 2

# Health Check
echo -e "\n✅ Checking health..."
if curl -s http://localhost:10000/health > /dev/null 2>&1; then
    RESPONSE=$(curl -s http://localhost:10000/health)
    echo "✅ Backend is running!"
    echo "Response: $RESPONSE"
    echo ""
    echo "📊 Backend Status:"
    echo "   URL: http://localhost:10000"
    echo "   Health: http://localhost:10000/health"
    echo "   Docs: http://localhost:10000/docs"
    echo "   PID: $(cat /root/agent-arena/backend/.pid)"
    echo "   Logs: tail -f /root/logs/uvicorn.log"
else
    echo "⚠️  Health check failed"
    echo "Last 20 log lines:"
    tail -20 /root/logs/uvicorn.log
fi

echo -e "\n=========================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env file: nano /root/agent-arena/backend/.env"
echo "2. View logs: tail -f /root/logs/uvicorn.log"
echo "3. Stop backend: kill \$(cat /root/agent-arena/backend/.pid)"
echo "4. Restart: bash /root/agent-arena/backend/deploy.sh"
echo ""
echo "🌐 API URLs:"
echo "   Base: http://localhost:10000"
echo "   Health: http://localhost:10000/health"
echo "   Swagger: http://localhost:10000/docs"
echo ""
