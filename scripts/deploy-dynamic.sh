#!/bin/bash

# Agriko Dynamic Deployment Script
# Sets up Next.js to run as a dynamic server behind Apache reverse proxy

set -e

echo "======================================="
echo "Agriko Dynamic Server Deployment"
echo "======================================="

# Configuration
SERVER_IP="143.42.189.57"
SERVER_USER="root"
APP_DIR="/var/www/shop"
NODE_VERSION="22"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will set up Next.js as a dynamic server on your production server.${NC}"
echo ""
echo "Prerequisites:"
echo "1. SSH access to $SERVER_IP as $SERVER_USER"
echo "2. Node.js $NODE_VERSION installed on server"
echo "3. Apache2 installed and running"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Step 1: Build the application locally
echo -e "\n${GREEN}Step 1: Building application locally...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Please fix errors and try again.${NC}"
    exit 1
fi

# Step 2: Create deployment package
echo -e "\n${GREEN}Step 2: Creating deployment package...${NC}"
tar -czf deploy.tar.gz \
    .next \
    public \
    package.json \
    package-lock.json \
    ecosystem.config.js \
    next.config.js \
    tsconfig.json \
    src \
    --exclude=node_modules \
    --exclude=.git

# Step 3: Upload to server
echo -e "\n${GREEN}Step 3: Uploading to server...${NC}"
scp deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Step 4: Deploy on server
echo -e "\n${GREEN}Step 4: Deploying on server...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Setting up application...${NC}"

# Backup current deployment
if [ -d /var/www/shop ]; then
    echo "Backing up current deployment..."
    cp -r /var/www/shop /var/www/shop.backup.$(date +%Y%m%d_%H%M%S)
fi

# Extract new deployment
cd /var/www/shop
tar -xzf /tmp/deploy.tar.gz
rm /tmp/deploy.tar.gz

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --production

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

# Create log directory
mkdir -p /var/log/pm2

# Set proper permissions
chown -R www-data:www-data /var/www/shop
chmod -R 755 /var/www/shop

# Copy environment variables
if [ -f /var/www/shop/.env.production ]; then
    cp /var/www/shop/.env.production /var/www/shop/.env.local
fi

# Stop existing PM2 process if running
pm2 stop agriko-shop 2>/dev/null || true
pm2 delete agriko-shop 2>/dev/null || true

# Start application with PM2
echo -e "${YELLOW}Starting Next.js server with PM2...${NC}"
cd /var/www/shop
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
pm2 save

# Enable Apache proxy modules
echo -e "${YELLOW}Configuring Apache...${NC}"
a2enmod proxy proxy_http proxy_wstunnel headers rewrite ssl

# Backup current Apache config
cp /etc/apache2/sites-available/shop.agrikoph.com.conf /etc/apache2/sites-available/shop.agrikoph.com.conf.static.backup

# Update Apache configuration (you need to manually copy the proxy config)
echo -e "${RED}IMPORTANT: You need to manually update the Apache configuration!${NC}"
echo "1. Copy apache-config/shop.agrikoph.com-proxy.conf to /etc/apache2/sites-available/shop.agrikoph.com.conf"
echo "2. Run: systemctl reload apache2"

# Test the setup
sleep 5
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Next.js server is running!${NC}"
else
    echo -e "${RED}✗ Next.js server failed to start. Check logs: pm2 logs agriko-shop${NC}"
    exit 1
fi

echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update Apache config with the proxy configuration"
echo "2. Reload Apache: systemctl reload apache2"
echo "3. Test the site at https://shop.agrikoph.com"
echo ""
echo "Useful commands:"
echo "- pm2 status        # Check app status"
echo "- pm2 logs          # View logs"
echo "- pm2 restart agriko-shop  # Restart app"
echo "- pm2 monit         # Monitor app"

ENDSSH

# Cleanup
rm deploy.tar.gz

echo -e "\n${GREEN}=======================================${NC}"
echo -e "${GREEN}Deployment script complete!${NC}"
echo -e "${GREEN}=======================================${NC}"
echo ""
echo "To complete the setup:"
echo "1. SSH into the server: ssh $SERVER_USER@$SERVER_IP"
echo "2. Copy the proxy config:"
echo "   cp /var/www/shop/apache-config/shop.agrikoph.com-proxy.conf /etc/apache2/sites-available/shop.agrikoph.com.conf"
echo "3. Reload Apache: systemctl reload apache2"
echo "4. Check the site: https://shop.agrikoph.com"