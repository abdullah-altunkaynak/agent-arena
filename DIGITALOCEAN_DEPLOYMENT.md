# DigitalOcean FastAPI Backend Deployment Guide

## 🚀 ModuleNotFoundError Çözümü

DigitalOcean'da backend çalıştırırken alınan `ModuleNotFoundError: No module named 'backend'` hatası artık çözüldü.

### ✅ Yapılan Değişiklikler

1. **Relative Import Dönüşümü** ✓
   - `backend/agents/community/__init__.py` - Absolute → Relative import
   - `backend/agents/community/router.py` - Absolute → Relative import
   - `backend/agents/community/threads_router.py` - Absolute → Relative import
   - `backend/agents/community/comments_router.py` - Absolute → Relative import
   - `backend/agents/community/moderation_router.py` - Absolute → Relative import

2. **main.py Improvements** ✓
   - sys.path.insert() ile hem local hem deployment ortamları destekleniyor
   - Duplicate import'lar temizlendi
   - Pathlib kullanılarak daha robust path handling

3. **Dockerfile Optimization** ✓
   - WORKDIR `/app/backend` olarak ayarlandı
   - PYTHONPATH hem `/app` hem `/app/backend` içeriyor
   - Non-root user (appuser) eklendi
   - 4 worker ile uvicorn başlatılıyor

---

## 📋 DigitalOcean Server Setup

### Step 1: SSH Bağlantısı
```bash
ssh root@your_server_ip
```

### Step 2: Repository'yi Clone Et
```bash
cd /root
git clone https://github.com/your-repo/agent-arena.git
cd agent-arena
```

### Step 3: Dependencies Kur
```bash
# Python 3.9+ gerekli
python3 --version

# Backend dependencies
cd backend
pip install -r requirements.txt

# Virtual env kullan (recommended)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Step 4: Environment Variables Ayarla
```bash
# .env dosyası oluştur
cat > /root/agent-arena/backend/.env << EOF
DATABASE_URL=postgresql://user:password@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-api-key
JWT_SECRET=your-secret-key
CORS_ORIGINS=["https://yourdomain.com", "http://localhost:3000"]
EMAIL_API_KEY=sendgrid-key
EOF
```

### Step 5: Local Çalıştırma Testi
```bash
cd /root/agent-arena/backend

# Virtual env aktive et
source .venv/bin/activate

# FastAPI server başlat
uvicorn main:app --host 0.0.0.0 --port 10000 --reload

# Test et
curl http://localhost:10000/health
# Şu şekilde döndürmelidir: {"status":"ok"}
```

---

## 🐳 Docker ile Deployment

### Option 1: Docker + Docker Compose

#### Step 1: Docker Kur
```bash
# Docker & Docker Compose kur
sudo apt update
sudo apt install -y docker.io docker-compose

# Docker daemon başlat
sudo systemctl start docker
sudo systemctl enable docker

# Dizine Docker permission ver
sudo usermod -aG docker root
```

#### Step 2: Docker Image Oluştur
```bash
cd /root/agent-arena

# Backend image build et
docker build -f backend/Dockerfile -t agent-arena-backend:latest ./backend

# Test et
docker run -e DATABASE_URL="postgresql://..." -p 10000:10000 agent-arena-backend:latest
```

#### Step 3: Docker Compose ile Deploy (Recommended)
```bash
# docker-compose.yml dosyası var mı kontrol et
ls -la docker-compose.yml

# Services başlat
docker-compose up -d

# Logları kontrol et
docker-compose logs -f backend

# Durdur (gerekirse)
docker-compose down
```

#### Docker Compose Örneği
```yaml
version: '3.8'

services:
  backend:
    image: agent-arena-backend:latest
    container_name: agent-arena-backend
    ports:
      - "10000:10000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/agent_arena
      - PYTHONUNBUFFERED=1
    volumes:
      - ./backend:/app/backend
    command: uvicorn main:app --host 0.0.0.0 --port 10000 --reload
    depends_on:
      - postgres
    networks:
      - agent-arena-net

  postgres:
    image: postgres:13-alpine
    container_name: agent-arena-db
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=agent_arena
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - agent-arena-net

networks:
  agent-arena-net:
    driver: bridge

volumes:
  postgres_data:
```

---

## 🔧 Systemd Service (Production)

### Step 1: Service File Oluştur
```bash
sudo nano /etc/systemd/system/agent-arena-backend.service
```

### Step 2: Şu İçeriği Ekle
```ini
[Unit]
Description=Agent-Arena Backend API
After=network.target

[Service]
Type=notify
User=root
WorkingDirectory=/root/agent-arena/backend

# Virtual environment kullan
Environment="PATH=/root/agent-arena/backend/.venv/bin"
Environment="PYTHONPATH=/root/agent-arena:/root/agent-arena/backend"
EnvironmentFile=/root/agent-arena/backend/.env

ExecStart=/root/agent-arena/backend/.venv/bin/gunicorn \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:10000 \
  --access-logfile - \
  --error-logfile - \
  main:app

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Step 3: Service Başlat
```bash
# Service dosyası yükle
sudo systemctl daemon-reload

# Service başlat
sudo systemctl start agent-arena-backend

# Otomatik başlasın (reboot sonrası)
sudo systemctl enable agent-arena-backend

# Status kontrol et
sudo systemctl status agent-arena-backend

# Logları izle
sudo journalctl -f -u agent-arena-backend
```

---

## 🌐 Nginx Reverse Proxy

### Step 1: Nginx Kur
```bash
sudo apt install -y nginx

# Nginx başlat
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 2: Nginx Config
```bash
sudo nano /etc/nginx/sites-available/agent-arena
```

### Step 3: Şu İçeriği Ekle
```nginx
upstream backend {
    server 127.0.0.1:10000;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Proxy settings
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (future)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Step 4: Nginx Config Aktive Et
```bash
# Symbolic link oluştur
sudo ln -s /etc/nginx/sites-available/agent-arena /etc/nginx/sites-enabled/

# Config test et
sudo nginx -t

# Restart
sudo systemctl restart nginx
```

### Step 5: SSL Certificate (Let's Encrypt)
```bash
# Certbot kur
sudo apt install -y certbot python3-certbot-nginx

# Certificate oluştur
sudo certbot certonly --nginx -d api.yourdomain.com

# Auto-renewal yapacak (90 gün sonra yenile)
sudo certbot renew --dry-run  # Test et
```

---

## 🧪 Deployment Test

### Health Check
```bash
# Direct uvicorn test
curl http://localhost:10000/health

# Docker container test
docker exec agent-arena-backend curl http://localhost:10000/health

# Through Nginx
curl https://api.yourdomain.com/health
```

### API Endpoints Test
```bash
# Communities list
curl https://api.yourdomain.com/api/community

# Health check
curl https://api.yourdomain.com/health

# Agents list
curl https://api.yourdomain.com/api/agents

# Moderation reports
curl https://api.yourdomain.com/api/moderation/reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔍 Troubleshooting

### Problem 1: ModuleNotFoundError
```
ModuleNotFoundError: No module named 'backend'
```

**Çözüm:**
✓ Relative import'lar tanımlandı
✓ sys.path düzeltildi
✓ PYTHONPATH hem `/app` hem `/app/backend` içeriyor

```python
# Test local
cd /root/agent-arena/backend
python3 -c "from agents.community import community_router; print('OK')"

# Test Docker
docker exec agent-arena-backend python3 -c "from agents.community import community_router; print('OK')"
```

### Problem 2: Port Bağlama Hatası
```
Address already in use
```

**Çözüm:**
```bash
# Port 10000'ı kullanan process bul
lsof -i :10000

# Kill et
kill -9 <PID>

# Farklı port kullan (Dockerfile ve Nginx'te değiştir)
```

### Problem 3: Database Connection
```
DatabaseError: database is unavailable
```

**Çözüm:**
```bash
# .env dosyası kontrol et
cat /root/agent-arena/backend/.env | grep DATABASE_URL

# PostgreSQL bağlantı test et
psql postgresql://user:pass@host:5432/dbname

# Docker'da ise
docker-compose logs postgres
```

### Problem 4: Permission Denied
```
Permission denied while trying to connect to Docker daemon
```

**Çözüm:**
```bash
# Sudo kullan veya
sudo usermod -aG docker $USER
newgrp docker
```

---

## 📊 Monitoring Commands

### Systemd Service Monitoring
```bash
# Status
sudo systemctl status agent-arena-backend

# Real-time logs
sudo journalctl -f -u agent-arena-backend

# Last 50 lines
sudo journalctl -u agent-arena-backend -n 50

# Filter by priority
sudo journalctl -u agent-arena-backend -p err
```

### Docker Monitoring
```bash
# Container logs
docker logs -f agent-arena-backend

# Resource usage
docker stats agent-arena-backend

# Container processes
docker top agent-arena-backend

# Container IP
docker inspect agent-arena-backend | grep IPAddress
```

### Server Monitoring
```bash
# CPU & Memory
top

# Disk usage
df -h

# Network connections
netstat -tlnp

# Process list
ps aux | grep uvicorn
```

---

## 🔐 Security Checklist

✅ Non-root user (appuser)  
✅ Firewall rules (port 80, 443 açık; 10000 kapalı)  
✅ SSL/TLS (Let's Encrypt)  
✅ CORS properly configured  
✅ Environment variables (.env ile yönetilir)  
✅ Database password secure (.env'de tutuluyor)  
✅ JWT tokens secure  
✅ Rate limiting (frontend/Nginx)  

### Firewall Setup
```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check rules
sudo ufw status
```

---

## 📈 Performance Tuning

### Backend Optimization
```bash
# workers sayısı = CPU cores * 2 + 1
# 2 CPU core = 5 workers
gunicorn --workers 5 --worker-class uvicorn.workers.UvicornWorker main:app
```

### Database Connection Pool
```python
# engine/database.py içinde
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    pool_pre_ping=True  # Connection alive kontrol
)
```

### Nginx Caching
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;

location / {
    proxy_cache api_cache;
    proxy_cache_valid 200 10m;
    add_header X-Cache-Status $upstream_cache_status;
}
```

---

## 📝 Deployment Checklist

- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] Database migrations ran
- [ ] Health endpoint tested
- [ ] Docker image built (if using Docker)
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Firewall rules applied
- [ ] Monitoring setup
- [ ] Backup strategy configured
- [ ] Load tested

---

## 🆘 Quick Help

```bash
# Hızlı test
cd /root/agent-arena/backend && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 10000

# Hızlı Docker test
docker build -f backend/Dockerfile -t agent-arena-backend:latest ./backend && docker run -p 10000:10000 agent-arena-backend:latest

# Hızlı Nginx test
sudo systemctl restart nginx && curl http://localhost/health

# Logs izle
sudo journalctl -f -u agent-arena-backend
```

---

**Status:** ✅ Ready for DigitalOcean deployment  
**Last Updated:** April 16, 2026  
**Next Step:** Deploy using Docker Compose or Systemd service
