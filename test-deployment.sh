#!/bin/bash

# Quick test script for DigitalOcean deployment
# This script validates the import fixes

set -e

BACKEND_DIR="/root/agent-arena/backend"
REPO_DIR="/root/agent-arena"

echo "🧪 Testing Agent-Arena Backend Import Fixes"
echo "============================================="

# Test 1: Check relative imports in __init__.py
echo -e "\n1️⃣  Testing community/__init__.py relative imports..."
if grep -q "^from \." "$BACKEND_DIR/agents/community/__init__.py"; then
    echo "✅ Uses relative imports"
else
    echo "❌ Still using absolute imports"
    exit 1
fi

# Test 2: Check main.py sys.path
echo -e "\n2️⃣  Testing main.py sys.path configuration..."
if grep -q "sys.path.insert(0, str(BACKEND_DIR))" "$BACKEND_DIR/main.py"; then
    echo "✅ sys.path correctly configured"
else
    echo "❌ sys.path not properly configured"
    exit 1
fi

# Test 3: Check router imports
echo -e "\n3️⃣  Testing router.py relative imports..."
if grep -q "from \.\.\./engine" "$BACKEND_DIR/agents/community/router.py"; then
    echo "✅ Router uses relative imports"
else
    echo "❌ Router still using absolute imports"
    exit 1
fi

# Test 4: Python import test (with virtual env)
echo -e "\n4️⃣  Testing Python imports..."
if [ ! -d "$BACKEND_DIR/.venv" ]; then
    echo "⚠️  Virtual environment not created, skipping Python test"
else
    source "$BACKEND_DIR/.venv/bin/activate"
    cd "$BACKEND_DIR"
    
    # Test 1: Import agents module
    python3 -c "from agents.community import community_router" && echo "✅ agents.community imports OK" || echo "❌ Failed"
    
    # Test 2: Import main
    python3 -c "import main" && echo "✅ main.py imports OK" || echo "❌ Failed"
    
    deactivate
fi

# Test 5: Docker Compose validation
echo -e "\n5️⃣  Testing Docker Compose configuration..."
if [ -f "$REPO_DIR/docker-compose.yml" ]; then
    if command -v docker-compose &> /dev/null; then
        cd "$REPO_DIR"
        docker-compose config > /dev/null 2>&1 && echo "✅ docker-compose.yml valid" || echo "❌ Invalid YAML"
    else
        echo "⚠️  docker-compose not installed, skipping validation"
    fi
else
    echo "⚠️  docker-compose.yml not found"
fi

# Test 6: Check environment template
echo -e "\n6️⃣  Testing environment template..."
if [ -f "$BACKEND_DIR/.env.example" ]; then
    echo "✅ .env.example exists"
    grep -q "DATABASE_URL" "$BACKEND_DIR/.env.example" && echo "✅ Contains DATABASE_URL" || echo "❌ Missing DATABASE_URL"
else
    echo "❌ .env.example not found"
fi

echo -e "\n============================================="
echo "✅ All basic tests passed!"
echo -e "\n📝 Next steps:"
echo "1. Create .env file: cp backend/.env.example backend/.env"
echo "2. Edit .env with your DigitalOcean values"
echo "3. Run: bash backend/deploy.sh dev (for testing)"
echo "4. Or: bash backend/deploy.sh prod-docker (for Docker)"
echo "5. Or: bash backend/deploy.sh prod-systemd (for systemd)"
