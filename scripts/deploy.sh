#!/bin/bash

# Agriko Shop Deployment Script
# This script handles the complete deployment process

set -e  # Exit on error

echo "🚀 Starting Agriko Shop Deployment..."

# Configuration
PORT=${PORT:-3001}
APP_NAME="agriko-shop"

# Step 1: Environment Setup
echo "📋 Setting up environment..."
if [ ! -f .env.production ]; then
    echo "❌ .env.production not found! Please create it from .env.production.example"
    exit 1
fi

# Step 2: Install Dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Step 3: Build with validation bypass
echo "🔨 Building application..."
SKIP_ENV_VALIDATION=true npm run build

# Step 4: Database Setup
echo "🗄️ Setting up databases..."

# Check if PostgreSQL is running
if ! docker ps | grep -q agriko-postgres; then
    echo "Starting PostgreSQL..."
    docker run -d \
        --name agriko-postgres \
        -e POSTGRES_USER=agriko \
        -e POSTGRES_PASSWORD=agrikodb123 \
        -e POSTGRES_DB=agriko_analytics \
        -p 5432:5432 \
        postgres:14
    sleep 5
fi

# Check if Memgraph is running
if ! docker ps | grep -q memgraph; then
    echo "Starting Memgraph..."
    docker run -d \
        --name memgraph \
        -p 3000:3000 \
        -p 7687:7687 \
        -p 7444:7444 \
        memgraph/memgraph-platform
fi

# Check if Qdrant is running
if ! docker ps | grep -q qdrant; then
    echo "Starting Qdrant..."
    docker run -d \
        --name qdrant \
        -p 6333:6333 \
        -p 6334:6334 \
        qdrant/qdrant
fi

# Step 5: PM2 Setup
echo "⚙️ Configuring PM2..."

# Stop existing instance if running
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup systemd -u $USER --hp $HOME || true

# Step 6: Health Check
echo "🏥 Running health check..."
sleep 5

if curl -f -s -o /dev/null http://localhost:$PORT/api/health; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed. Checking logs..."
    pm2 logs $APP_NAME --lines 50
    exit 1
fi

echo "✅ Deployment complete!"
echo "🌐 Application running at: http://localhost:$PORT"
echo ""
echo "📊 Useful commands:"
echo "  pm2 status        - Check application status"
echo "  pm2 logs          - View application logs"
echo "  pm2 restart $APP_NAME - Restart application"
echo "  pm2 monit         - Monitor application"