# Phase 2 Deployment Guide
## Community & Discussion System

**Document Version:** 1.0  
**Created:** Phase 2 Task 9  
**Last Updated:** April 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Production Checklist](#production-checklist)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring & Logging](#monitoring--logging)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
```
Python 3.9+
Node.js 16+
PostgreSQL 13+ (or Supabase)
Docker & Docker Compose (for containerized deployment)
Git
Redis (optional, for caching)
```

### Required Accounts
- Supabase account (database hosting)
- AWS S3 (for media storage)
- SendGrid (for email notifications)
- GitHub (for CI/CD)

### System Requirements (Production)
- **Backend:** CPU 2-4 cores, RAM 4-8GB, Disk 50GB
- **Frontend:** CDN + static hosting (Vercel, Netlify)
- **Database:** Managed PostgreSQL 50GB+
- **Monitoring:** New Relic / DataDog

---

## Database Setup

### 1. Supabase Configuration

#### Create Project
```bash
# Login to Supabase dashboard
https://supabase.com/dashboard

# Create new project
1. Project Name: "agent-arena-prod"
2. Database Password: [Strong password 16+ chars]
3. Region: Choose closest to users (us-east-1 recommended)
4. Pricing Plan: Pro ($25/month minimum for prod)
```

#### Retrieve Credentials
```bash
# Get from Supabase project settings:
- API URL: https://[project-id].supabase.co
- Anon Key: eyJ... (public key)
- Service Role Key: eyJ... (private key)
- Database Password: [your postgres password]
- Database Host: db.[project-id].supabase.co
- Database Port: 5432
```

### 2. Database Migrations

#### Phase 2 Tables Schema

```sql
-- Create moderation tables
CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('thread', 'comment', 'user')),
  target_id UUID NOT NULL,
  reporter_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS user_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  notes TEXT,
  auto_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now(),
  INDEX idx_user_id (user_id),
  INDEX idx_severity (severity)
);

CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  changes JSONB,
  created_at TIMESTAMP DEFAULT now(),
  INDEX idx_moderator_id (moderator_id),
  INDEX idx_action (action)
);

-- Extend existing tables
ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE threads ADD COLUMN IF NOT EXISTS locked_reason TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted_by_mod BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_threads_locked ON threads(is_locked);
CREATE INDEX IF NOT EXISTS idx_threads_pinned ON threads(is_pinned);
CREATE INDEX IF NOT EXISTS idx_threads_category ON threads(category_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread ON comments(thread_id);
```

#### Run Migrations via Supabase SQL Editor

```bash
# 1. Login to Supabase Dashboard
# 2. Go to SQL Editor
# 3. Click "New Query"
# 4. Paste the schema above
# 5. Click "Run"
```

### 3. Enable RLS (Row Level Security)

```sql
-- Enable RLS on moderation tables
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for moderation_reports
CREATE POLICY "Anyone can create report" ON moderation_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id OR reporter_id IS NULL);

CREATE POLICY "Moderators can view reports" ON moderation_reports
  FOR SELECT USING (auth.jwt()->'user_metadata'->>'role' = 'moderator');

CREATE POLICY "Moderators can update reports" ON moderation_reports
  FOR UPDATE USING (auth.jwt()->'user_metadata'->>'role' = 'moderator');

-- Create policies for user_warnings
CREATE POLICY "Host_can_manage_warnings" ON user_warnings
  FOR ALL USING (auth.jwt()->'user_metadata'->>'role' IN ('admin', 'moderator'));

-- Create policies for moderation_logs
CREATE POLICY "Only admins_can_view_logs" ON moderation_logs
  FOR SELECT USING (auth.jwt()->'user_metadata'->>'role' = 'admin');
```

### 4. Backup Strategy

```bash
# Weekly automated backups (Supabase handles this)
# Manual backup before major updates:

# Export database
pg_dump \
  -h db.[project-id].supabase.co \
  -U postgres \
  -d postgres \
  > backup_$(date +%Y%m%d).sql

# Import backup
psql \
  -h db.[project-id].supabase.co \
  -U postgres \
  -d postgres \
  < backup_20260416.sql
```

---

## Environment Configuration

### 1. Backend Environment Files

Create `.env` in `backend/` directory:

```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_KEY=[anon-key]
SUPABASE_SERVICE_KEY=[service-role-key]

# Authentication
JWT_SECRET=[generate-with-openssl-rand-base64-32]
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Mail Service
SENDGRID_API_KEY=[your-sendgrid-key]
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# S3 Storage
AWS_ACCESS_KEY_ID=[your-aws-key]
AWS_SECRET_ACCESS_KEY=[your-aws-secret]
AWS_REGION=us-east-1
AWS_BUCKET_NAME=agent-arena-media

# API Configuration
API_PORT=8000
API_HOST=0.0.0.0
LOG_LEVEL=INFO
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Environment
ENVIRONMENT=production
DEBUG=false
```

Generate JWT_SECRET:
```bash
openssl rand -base64 32
# Output: abc123...xyz789
```

### 2. Frontend Environment Files

Create `.env.local` in `frontend/` directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXX
NEXT_PUBLIC_MIXPANEL_TOKEN=xxx

# Feature Flags
NEXT_PUBLIC_ENABLE_MODERATION=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Deployment
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ENVIRONMENT=production
```

### 3. Docker Environment

Create `docker-compose.env`:

```bash
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=[strong-password]
POSTGRES_DB=agent_arena
POSTGRES_INITDB_ARGS="-c shared_buffers=256MB -c effective_cache_size=1GB"

# Backend
BACKEND_PORT=8000
BACKEND_WORKERS=4

# Frontend
FRONTEND_PORT=3000

# Redis
REDIS_PORT=6379
```

---

## Backend Deployment

### 1. Local Development Setup

```bash
# Clone and setup
git clone https://github.com/yourusername/agent-arena.git
cd agent-arena/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run migrations
alembic upgrade head

# Start development server
uvicorn main:app --reload --port 8000
```

### 2. Production Deployment (AWS EC2 / VPS)

#### Option A: Traditional Server Deployment

```bash
# 1. SSH into server
ssh -i key.pem ubuntu@your-server-ip

# 2. Install dependencies
sudo apt-get update
sudo apt-get install -y python3.9 python3-pip python3-venv postgresql-client

# 3. Clone repository
git clone https://github.com/yourusername/agent-arena.git
cd agent-arena/backend

# 4. Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. Create .env file
nano .env
# Paste production environment variables

# 6. Run migrations
alembic upgrade head

# 7. Create systemd service
sudo nano /etc/systemd/system/agent-arena-api.service
```

Create `/etc/systemd/system/agent-arena-api.service`:

```ini
[Unit]
Description=Agent Arena API
After=network.target postgresql.service

[Service]
Type=notify
User=ubuntu
WorkingDirectory=/home/ubuntu/agent-arena/backend

Environment="PATH=/home/ubuntu/agent-arena/backend/venv/bin"
EnvironmentFile=/home/ubuntu/agent-arena/backend/.env

ExecStart=/home/ubuntu/agent-arena/backend/venv/bin/gunicorn \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile - \
  main:app

Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable agent-arena-api
sudo systemctl start agent-arena-api
sudo systemctl status agent-arena-api
```

### 3. Load Balancing & Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/agent-arena-api`:

```nginx
upstream api_backend {
    server localhost:8000;
    server localhost:8001;  # If running multiple workers
    server localhost:8002;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    client_max_body_size 100M;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json;
    gzip_min_length 1000;

    location / {
        proxy_pass http://api_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://api_backend;
        access_log off;
    }
}

# HTTPS (with Let's Encrypt)
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://api_backend;
        # ... same proxy settings as above
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

Enable and verify:
```bash
sudo ln -s /etc/nginx/sites-available/agent-arena-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Health Check Endpoint

Add to `backend/main.py`:

```python
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0"
    }
```

---

## Frontend Deployment

### 1. Build Optimization

```bash
# Build for production
cd frontend
npm run build

# Analyze bundle size
npm run analyze

# Expected sizes:
# Main bundle: < 500KB gzipped
# Chunks: < 200KB each
```

### 2. Deployment Options

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# - NEXT_PUBLIC_SUPABASE_URL=...
# - NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Vercel Configuration (`vercel.json`):

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

#### Option B: Self-Hosted (AWS S3 + CloudFront)

```bash
# Build static site
npm run build
npm run export  # If static export needed

# Upload to S3
aws s3 sync out/ s3://yourdomain.com --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```

#### Option C: Docker on VPS

See Docker Deployment section below.

---

## Docker Deployment

### 1. Backend Dockerfile

```dockerfile
# Use official Python runtime as base image
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["gunicorn", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "main:app"]
```

### 2. Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
```

### 3. Docker Compose

```yaml
version: '3.8'

services:
  db:
    image: postgres:13-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
    ports:
      - "${BACKEND_PORT}:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --reload

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    ports:
      - "${FRONTEND_PORT}:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app

volumes:
  postgres_data:
```

Deploy with Docker Compose:
```bash
# Create .env file
cp docker-compose.env .env

# Build and start
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

---

## Production Checklist

### Pre-Deployment

- [ ] All tests pass (backend, frontend, E2E)
- [ ] Code review completed
- [ ] Security audit done
- [ ] Database backups configured
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] CDN configured (CloudFlare, Cloudfront)
- [ ] Email service configured (SendGrid)
- [ ] Payment processing configured (if needed)

### Infrastructure

- [ ] Database replicated (multi-AZ)
- [ ] Load balancer configured
- [ ] Auto-scaling enabled
- [ ] Backup strategy defined
- [ ] Disaster recovery plan documented
- [ ] Monitoring alerts set up
- [ ] Logging aggregation configured
- [ ] Rate limiting enabled

### Security

- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] JWT secrets rotated
- [ ] Database passwords secured in vault
- [ ] API keys in environment variables
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Rate limiting per endpoint

### Application

- [ ] Environment variables validated
- [ ] Error messages don't expose internals
- [ ] Logging configured (no sensitive data)
- [ ] Health checks working
- [ ] Graceful shutdown implemented
- [ ] Database migrations tested
- [ ] Feature flags configured
- [ ] Analytics tracking enabled

### Monitoring

- [ ] Application metrics collected
- [ ] Error tracking enabled (Sentry)
- [ ] Performance monitoring active
- [ ] Uptime monitoring set up
- [ ] Alert thresholds configured
- [ ] Log retention policies set
- [ ] Database performance monitored
- [ ] API latency tracked

### Documentation

- [ ] Deployment runbook documented
- [ ] Incident response plan prepared
- [ ] Rollback procedure documented
- [ ] On-call schedule established
- [ ] Team trained on deployment
- [ ] Change log maintained
- [ ] Architecture diagram updated

### Post-Deployment

- [ ] Verify all services running
- [ ] Check database connectivity
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check API response times
- [ ] Verify SSL certificate
- [ ] Test email notifications
- [ ] Monitor resource usage

---

## Performance Optimization

### 1. Database Optimization

```sql
-- Add missing indexes
CREATE INDEX idx_communities_created ON communities(created_at);
CREATE INDEX idx_threads_community_created ON threads(community_id, created_at);
CREATE INDEX idx_comments_created ON comments(created_at);

-- Query optimization
ANALYZE;
VACUUM ANALYZE;

-- Connection pooling (configure in backend)
# In requirements.txt
psycopg[binary]==3.1.8
SQLAlchemy==2.0.0
sqlalchemy-utils==0.41.1
```

### 2. Caching Strategy

Add Redis caching to backend:

```python
import redis.asyncio as redis

# In main.py
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost"))

# Cache community listings
async def get_communities_cached(skip: int = 0, limit: int = 10):
    cache_key = f"communities:{skip}:{limit}"
    cached = await redis_client.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    communities = await get_communities(skip, limit)
    await redis_client.setex(cache_key, 3600, json.dumps(communities))  # 1 hour TTL
    return communities
```

### 3. Frontend Optimization

```javascript
// next.config.js
module.exports = {
  swcMinify: true,
  images: {
    domains: ['yourdomain.com', 's3.amazonaws.com'],
    sizes: [320, 640, 1024, 1280],
  },
  compress: true,
  poweredByHeader: false,
};
```

### 4. API Response Compression

```nginx
# In nginx.conf
gzip on;
gzip_types text/plain application/json application/javascript;
gzip_min_length 1024;
gzip_comp_level 6;
```

### 5. Database Query Optimization

```python
# Use select_related and prefetch_related
from sqlalchemy.orm import selectinload

# Bad: N+1 queries
threads = db.query(Thread).all()
for thread in threads:
    print(thread.author.name)  # New query for each thread

# Good: Batch loading
threads = db.query(Thread).options(selectinload(Thread.author)).all()
for thread in threads:
    print(thread.author.name)  # No additional queries
```

---

## Monitoring & Logging

### 1. Application Monitoring

Set up New Relic:

```python
# In main.py
import newrelic.agent

newrelic.agent.initialize()

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

### 2. Error Tracking

Set up Sentry:

```python
# In main.py
import sentry_sdk
from sentry_sdk.integrations.asgi import SentryAsgiMiddleware

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    traces_sample_rate=0.1,
    environment=os.getenv("ENVIRONMENT")
)

app.add_middleware(SentryAsgiMiddleware)
```

### 3. Structured Logging

```python
import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
        }
        return json.dumps(log_data)

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logging.getLogger().addHandler(handler)
```

### 4. Key Metrics to Monitor

```
- API Response Time (target: < 200ms p95)
- Error Rate (target: < 0.1%)
- Database Connection Pool Usage
- Memory Usage (target: < 80%)
- CPU Usage (target: < 70%)
- Request Rate (requests/second)
- Cache Hit Rate (target: > 80%)
- Active Users
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failures

```bash
# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
# Add to logs:
SQLAlchemy event logging:
logging.getLogger('sqlalchemy.pool').setLevel(logging.DEBUG)
```

#### 2. High Memory Usage

```bash
# Monitor memory
docker stats

# Check for memory leaks
# Add to backend:
import tracemalloc
tracemalloc.start()

# Profile memory
python -m memory_profiler backend/main.py
```

#### 3. Slow API Responses

```python
# Add timing middleware
@app.middleware("http")
async def log_request_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    
    if duration > 1000:  # Log queries > 1 second
        logger.warning(f"Slow request: {request.url.path} ({duration:.0f}ms)")
    
    return response
```

#### 4. Database Locks

```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- Kill long-running query
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE duration > interval '1 hour';
```

#### 5. Failed Deployments

```bash
# Rollback to previous version
git revert HEAD
npm run build
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs backend -f --tail=100
```

---

## Environment-Specific Configurations

### Development
```bash
DEBUG=true
LOG_LEVEL=DEBUG
WORKERS=1
```

### Staging
```bash
DEBUG=false
LOG_LEVEL=INFO
WORKERS=2
```

### Production
```bash
DEBUG=false
LOG_LEVEL=ERROR
WORKERS=4
REPLICAS=3
```

---

## Rollback Procedure

If issues occur after deployment:

```bash
# 1. Stop new deployment
docker-compose down

# 2. Revert code
git revert --no-edit <commit-hash>

# 3. Rebuild (if needed)
npm run build  # frontend
pip install -r requirements.txt  # backend

# 4. Restart services
docker-compose up -d

# 5. Verify health
curl https://api.yourdomain.com/health
curl https://yourdomain.com/

# 6. Monitor logs
docker-compose logs -f
```

---

## Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor API response times
- [ ] Verify database backups completed

### Weekly
- [ ] Check disk space usage
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Run integrity checks

### Monthly
- [ ] Database optimization (VACUUM, ANALYZE)
- [ ] SSL certificate renewal check
- [ ] Performance analysis
- [ ] Security audit

### Quarterly
- [ ] Disaster recovery drill
- [ ] Capacity planning review
- [ ] Architecture review
- [ ] Cost optimization analysis

---

## Support & Resources

- **Documentation:** https://yourdomain.com/docs
- **Status Page:** https://status.yourdomain.com
- **Support Portal:** https://support.yourdomain.com
- **Team Slack:** #agent-arena-prod
- **On-Call:** PagerDuty integration

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Apr 2026 | Initial Phase 2 deployment guide |

---

**Deployment Guide Complete**  
**Status:** Ready for Production  
**Last Reviewed:** April 2026
