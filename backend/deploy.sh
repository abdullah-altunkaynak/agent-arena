#!/bin/bash

# Agent-Arena Backend Startup Script for DigitalOcean
# Usage: bash deploy.sh [option]
# Options: dev, prod-docker, prod-systemd

set -e

BACKEND_DIR="/root/agent-arena/backend"
REPO_DIR="/root/agent-arena"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Agent-Arena Backend Deployment Script        ║${NC}"
echo -e "${BLUE}║  DigitalOcean Edition                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python $(python3 --version)${NC}"

# Navigate to backend
cd "$BACKEND_DIR"

# Option 1: Development Mode
run_dev() {
    echo -e "\n${YELLOW}Starting in DEVELOPMENT mode...${NC}"
    
    # Create venv if not exists
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python3 -m venv .venv
    fi
    
    # Activate venv
    source .venv/bin/activate
    
    # Install/upgrade dependencies
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pip install -q -r requirements.txt
    
    # Check .env
    if [ ! -f ".env" ]; then
        echo -e "${RED}✗ .env file not found${NC}"
        echo -e "${YELLOW}Create .env with these values:${NC}"
        echo "DATABASE_URL=postgresql://user:password@localhost:5432/agent_arena"
        echo "SUPABASE_URL=https://your-project.supabase.co"
        echo "SUPABASE_KEY=your-anon-key"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    
    # Start development server
    echo -e "${BLUE}Starting FastAPI development server...${NC}"
    echo -e "${BLUE}API available at: http://localhost:10000${NC}"
    echo -e "${BLUE}Docs at: http://localhost:10000/docs${NC}"
    
    uvicorn main:app --host 0.0.0.0 --port 10000 --reload
}

# Option 2: Docker Production
run_docker() {
    echo -e "\n${YELLOW}Starting in DOCKER production mode...${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker installed${NC}"
    
    # Build image
    echo -e "${YELLOW}Building Docker image...${NC}"
    cd "$REPO_DIR"
    docker build -f backend/Dockerfile -t agent-arena-backend:latest ./backend
    
    echo -e "${GREEN}✓ Docker image built${NC}"
    
    # Check if docker-compose exists
    if [ -f "docker-compose.yml" ]; then
        echo -e "${YELLOW}Starting with docker-compose...${NC}"
        docker-compose up -d
        
        echo -e "${GREEN}✓ Services started${NC}"
        echo -e "${BLUE}Backend available at: http://localhost:10000${NC}"
        echo -e "${BLUE}View logs: docker-compose logs -f backend${NC}"
    else
        echo -e "${YELLOW}Starting with docker run...${NC}"
        docker run -d \
            --name agent-arena-backend \
            -p 10000:10000 \
            -e PYTHONUNBUFFERED=1 \
            --restart unless-stopped \
            agent-arena-backend:latest
        
        echo -e "${GREEN}✓ Docker container started${NC}"
        echo -e "${BLUE}Backend available at: http://localhost:10000${NC}"
        echo -e "${BLUE}View logs: docker logs -f agent-arena-backend${NC}"
    fi
}

# Option 3: Systemd Service (Production)
run_systemd() {
    echo -e "\n${YELLOW}Starting with SYSTEMD service...${NC}"
    
    # Create venv if not exists
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python3 -m venv .venv
    fi
    
    # Activate venv and install deps
    source .venv/bin/activate
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pip install -q -r requirements.txt
    
    # Install gunicorn
    pip install -q gunicorn uvicorn
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    
    # Create systemd service file
    echo -e "${YELLOW}Creating systemd service...${NC}"
    
    VENV_PATH="$BACKEND_DIR/.venv/bin"
    
    sudo tee /etc/systemd/system/agent-arena-backend.service > /dev/null << EOF
[Unit]
Description=Agent-Arena Backend API
After=network.target

[Service]
Type=notify
User=root
WorkingDirectory=$BACKEND_DIR

Environment="PATH=$VENV_PATH"
Environment="PYTHONPATH=$REPO_DIR:$BACKEND_DIR"
EnvironmentFile=$BACKEND_DIR/.env

ExecStart=$VENV_PATH/gunicorn \\
  --workers 4 \\
  --worker-class uvicorn.workers.UvicornWorker \\
  --bind 0.0.0.0:10000 \\
  --access-logfile - \\
  --error-logfile - \\
  main:app

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    echo -e "${GREEN}✓ Systemd service created${NC}"
    
    # Enable and start service
    echo -e "${YELLOW}Enabling and starting service...${NC}"
    sudo systemctl daemon-reload
    sudo systemctl enable agent-arena-backend
    sudo systemctl start agent-arena-backend
    
    echo -e "${GREEN}✓ Service started${NC}"
    echo -e "${BLUE}View status: sudo systemctl status agent-arena-backend${NC}"
    echo -e "${BLUE}View logs: sudo journalctl -f -u agent-arena-backend${NC}"
}

# Main logic
case "${1:-dev}" in
    dev)
        run_dev
        ;;
    prod-docker)
        run_docker
        ;;
    prod-systemd)
        run_systemd
        ;;
    *)
        echo -e "${YELLOW}Usage: bash deploy.sh [option]${NC}"
        echo ""
        echo "Options:"
        echo "  dev              - Development mode (uvicorn with reload)"
        echo "  prod-docker      - Production with Docker"
        echo "  prod-systemd     - Production with Systemd service"
        echo ""
        echo "Example:"
        echo "  bash deploy.sh dev"
        echo "  bash deploy.sh prod-docker"
        echo "  bash deploy.sh prod-systemd"
        exit 0
        ;;
esac
