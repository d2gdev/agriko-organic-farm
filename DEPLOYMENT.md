# Agriko Shop Deployment Guide

## Quick Start

```bash
# Simple deployment
npm run build:prod
npm run pm2:start

# Or use the deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## Prerequisites

1. **Node.js** v18+ and npm
2. **PM2** for process management: `npm install -g pm2`
3. **Docker** for databases
4. **Environment file**: Copy `.env.example` to `.env.production`

## Key Changes Made for Easier Deployment

### 1. Environment Validation
- **Problem**: `process.exit(1)` calls were killing the production server
- **Solution**:
  - Disabled hard exits in production
  - Added `SKIP_ENV_VALIDATION=true` flag for builds
  - Graceful degradation instead of crashes

### 2. Build Process
- **New Scripts**:
  - `npm run build:prod` - Builds with validation bypass
  - `npm run start:prod` - Starts on port 3001
  - `npm run deploy:local` - Complete local deployment

### 3. PM2 Configuration
- **File**: `ecosystem.config.js`
- Auto-restart on crashes
- Memory limit management
- Log rotation
- Graceful shutdown

### 4. Database Setup
- PostgreSQL for analytics
- Memgraph for graph data
- Qdrant for vector search

## Deployment Steps

### 1. Initial Setup
```bash
# Clone repository
git clone <your-repo>
cd agriko-shop

# Install dependencies
npm ci

# Create environment file
cp .env.example .env.production
# Edit .env.production with your values
```

### 2. Database Setup
```bash
# PostgreSQL
docker run -d \
  --name agriko-postgres \
  -e POSTGRES_USER=agriko \
  -e POSTGRES_PASSWORD=agrikodb123 \
  -e POSTGRES_DB=agriko_analytics \
  -p 5432:5432 \
  postgres:14

# Memgraph
docker run -d \
  --name memgraph \
  -p 3000:3000 -p 7687:7687 -p 7444:7444 \
  memgraph/memgraph-platform

# Qdrant
docker run -d \
  --name qdrant \
  -p 6333:6333 -p 6334:6334 \
  qdrant/qdrant
```

### 3. Build and Deploy
```bash
# Build for production
npm run build:prod

# Start with PM2
npm run pm2:start

# Or use the all-in-one script
./scripts/deploy.sh
```

### 4. Monitoring
```bash
# Check status
pm2 status

# View logs
pm2 logs agriko-shop

# Monitor resources
pm2 monit

# Restart if needed
pm2 restart agriko-shop
```

## Environment Variables

Critical variables for production:

```env
# Application
NODE_ENV=production
PORT=3001

# WooCommerce API
NEXT_PUBLIC_WC_API_URL=https://agrikoph.com/wp-json/wc/v3
WC_CONSUMER_KEY=your_key
WC_CONSUMER_SECRET=your_secret

# Database
DATABASE_URL=postgresql://agriko:agrikodb123@localhost:5432/agriko_analytics

# Optional Services (won't crash if missing)
MEMGRAPH_URL=bolt://localhost:7687
QDRANT_URL=http://localhost:6333
```

## Troubleshooting

### Server Exits Immediately
- Check logs: `pm2 logs agriko-shop`
- Ensure `.env.production` exists
- Verify databases are running

### 500 Errors on Products Page
- Check WooCommerce API credentials
- Verify API URL is accessible
- Check network connectivity

### Port Already in Use
```bash
# Kill process on port 3001
fuser -k 3001/tcp
# Or
lsof -ti:3001 | xargs kill -9
```

### Memory Issues
- Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096"`
- Adjust PM2 config: `max_memory_restart` in ecosystem.config.js

## Production Checklist

- [ ] Environment variables configured
- [ ] Databases running
- [ ] Build successful
- [ ] PM2 process stable
- [ ] Health check passing: `curl http://localhost:3001/api/health`
- [ ] Products page loading: `curl -I http://localhost:3001/products`

## CI/CD Integration

For automated deployments:

```yaml
# GitHub Actions example
- name: Deploy
  run: |
    npm ci
    npm run build:prod
    pm2 reload ecosystem.config.js --env production
```

## Security Notes

1. Never commit `.env.production`
2. Use strong passwords for databases
3. Enable firewall for production
4. Use HTTPS in production
5. Rotate API keys regularly

## Support

- Check logs: `pm2 logs`
- Health endpoint: `http://localhost:3001/api/health`
- PM2 dashboard: `pm2 monit`