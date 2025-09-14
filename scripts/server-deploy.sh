#!/bin/bash

# Simple deployment script to run ON THE SERVER
# SSH to server first, then run this script

echo "Starting Agriko Dynamic Deployment..."

# Make sure we're in the right directory
cd /var/www/shop || exit 1

# Install dependencies (if node_modules doesn't exist or is broken)
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/next" ]; then
    echo "Installing dependencies..."
    rm -rf node_modules package-lock.json
    npm install
fi

# Build the application
echo "Building application..."
npm run build

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Stop any existing PM2 process
pm2 stop agriko-shop 2>/dev/null || true
pm2 delete agriko-shop 2>/dev/null || true

# Start the application
echo "Starting Next.js server..."
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save
pm2 startup systemd -u root --hp /root

# Update Apache configuration
echo "Updating Apache configuration..."

# Enable required modules
a2enmod proxy proxy_http proxy_wstunnel headers rewrite ssl

# Backup old config
cp /etc/apache2/sites-available/shop.agrikoph.com.conf /etc/apache2/sites-available/shop.agrikoph.com.conf.backup.$(date +%Y%m%d)

# Copy new proxy config
cp /var/www/shop/apache-config/shop.agrikoph.com-proxy.conf /etc/apache2/sites-available/shop.agrikoph.com.conf

# Reload Apache
systemctl reload apache2

echo "Deployment complete!"
echo ""
echo "Check status with:"
echo "  pm2 status"
echo "  pm2 logs agriko-shop"
echo ""
echo "Site should be available at: https://shop.agrikoph.com"