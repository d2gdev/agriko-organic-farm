# Agriko Deployment Guide

## Overview
This guide provides multiple deployment strategies for the Agriko Next.js application to your Ubuntu bare metal server with Apache2.

## Current Setup Analysis
- **Frontend:** Next.js 15 with App Router (SSG/SSR hybrid)
- **Build Output:** Static export compatible
- **Server:** Ubuntu bare metal with Apache2
- **Domain:** agrikoph.com (shop.agrikoph.com)

## Deployment Options

### Option 1: Static Export Deployment (Recommended for Current Setup)
**Best for:** Current static-heavy application with existing Apache2 setup

#### Advantages:
- ✅ Works perfectly with Apache2
- ✅ No Node.js server required
- ✅ Maximum performance and caching
- ✅ Simple deployment process
- ✅ Existing Apache2 configuration compatible

#### Configuration Required:
1. Enable static export in Next.js
2. Configure Apache2 virtual host
3. Set up automated build and deploy scripts

---

### Option 2: PM2 + Apache2 Reverse Proxy
**Best for:** Future dynamic features and API routes

#### Advantages:
- ✅ Full Next.js SSR capabilities
- ✅ API routes support
- ✅ Dynamic content generation
- ✅ Apache2 as reverse proxy for static assets

#### Configuration Required:
1. Install Node.js and PM2 on server
2. Configure Apache2 reverse proxy
3. Set up process management

---

### Option 3: Docker Containerized Deployment
**Best for:** Production scalability and consistency

#### Advantages:
- ✅ Consistent environment across deployments
- ✅ Easy scaling and management
- ✅ Isolated dependencies
- ✅ Blue-green deployment support

---

## Recommended Implementation: Static Export + Apache2

### Step 1: Next.js Configuration

Update `next.config.js` for static export:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['agrikoph.com', 'shop.agrikoph.com'],
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://shop.agrikoph.com' : '',
  
  // Ensure static generation for all pages
  experimental: {
    staticPageGenerationTimeout: 120,
  },
  
  // Configure headers for better performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Step 2: Package.json Scripts

Add deployment scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:export": "next build && next export",
    "deploy:build": "npm ci --production=false && npm run build:export",
    "deploy:sync": "rsync -avz --delete out/ user@your-server:/var/www/agrikoph.com/",
    "deploy": "npm run deploy:build && npm run deploy:sync",
    "deploy:full": "npm run lint && npm run type-check && npm run deploy"
  }
}
```

### Step 3: Apache2 Virtual Host Configuration

Create `/etc/apache2/sites-available/shop.agrikoph.com.conf`:

```apache
<VirtualHost *:80>
    ServerName shop.agrikoph.com
    DocumentRoot /var/www/agrikoph.com
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName shop.agrikoph.com
    DocumentRoot /var/www/agrikoph.com
    
    # SSL Configuration (Let's Encrypt recommended)
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/shop.agrikoph.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/shop.agrikoph.com/privkey.pem
    
    # Security Headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set Referrer-Policy strict-origin-when-cross-origin
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    
    # Compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/plain
        AddOutputFilterByType DEFLATE text/html
        AddOutputFilterByType DEFLATE text/xml
        AddOutputFilterByType DEFLATE text/css
        AddOutputFilterByType DEFLATE application/xml
        AddOutputFilterByType DEFLATE application/xhtml+xml
        AddOutputFilterByType DEFLATE application/rss+xml
        AddOutputFilterByType DEFLATE application/javascript
        AddOutputFilterByType DEFLATE application/x-javascript
        AddOutputFilterByType DEFLATE application/json
    </IfModule>
    
    # Caching
    <IfModule mod_expires.c>
        ExpiresActive On
        
        # Images
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/webp "access plus 1 year"
        ExpiresByType image/avif "access plus 1 year"
        ExpiresByType image/svg+xml "access plus 1 year"
        ExpiresByType image/x-icon "access plus 1 year"
        
        # CSS and JavaScript
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType application/x-javascript "access plus 1 year"
        
        # HTML
        ExpiresByType text/html "access plus 1 hour"
    </IfModule>
    
    # Next.js routing - handle client-side routing
    <Directory /var/www/agrikoph.com>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Handle Next.js routing
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteCond %{REQUEST_URI} !^/api/
        RewriteRule ^(.*)$ /index.html [L]
    </Directory>
    
    # Logs
    ErrorLog ${APACHE_LOG_DIR}/shop.agrikoph.com_error.log
    CustomLog ${APACHE_LOG_DIR}/shop.agrikoph.com_access.log combined
</VirtualHost>
```

### Step 4: Deployment Scripts

#### Local Deployment Script (`deploy.sh`):

```bash
#!/bin/bash

# Agriko Deployment Script
set -e

# Configuration
REMOTE_USER="your-username"
REMOTE_HOST="your-server-ip"
REMOTE_PATH="/var/www/agrikoph.com"
BUILD_DIR="out"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Agriko deployment...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --production=false

# Step 2: Run tests
echo -e "${YELLOW}🧪 Running tests and linting...${NC}"
npm run lint
npm run type-check

# Step 3: Build application
echo -e "${YELLOW}🏗️  Building application...${NC}"
npm run build:export

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Build failed - $BUILD_DIR directory not found${NC}"
    exit 1
fi

# Step 4: Backup current deployment (on server)
echo -e "${YELLOW}💾 Creating backup on server...${NC}"
ssh $REMOTE_USER@$REMOTE_HOST "
    if [ -d '$REMOTE_PATH' ]; then
        sudo cp -r $REMOTE_PATH $REMOTE_PATH.backup.\$(date +%Y%m%d-%H%M%S)
        echo 'Backup created successfully'
    fi
"

# Step 5: Deploy to server
echo -e "${YELLOW}🚚 Deploying to server...${NC}"
rsync -avz --delete $BUILD_DIR/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# Step 6: Set correct permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
ssh $REMOTE_USER@$REMOTE_HOST "
    sudo chown -R www-data:www-data $REMOTE_PATH
    sudo chmod -R 755 $REMOTE_PATH
    sudo systemctl reload apache2
"

# Step 7: Verify deployment
echo -e "${YELLOW}✅ Verifying deployment...${NC}"
if curl -f -s -o /dev/null "https://shop.agrikoph.com"; then
    echo -e "${GREEN}🎉 Deployment successful! Site is live at https://shop.agrikoph.com${NC}"
else
    echo -e "${RED}⚠️  Warning: Site may not be immediately available. Check Apache logs if issues persist.${NC}"
fi

echo -e "${GREEN}✨ Deployment complete!${NC}"
```

#### Server Setup Script (`server-setup.sh`):

```bash
#!/bin/bash

# Server setup script for Agriko deployment
set -e

# Configuration
DOMAIN="shop.agrikoph.com"
WEB_ROOT="/var/www/agrikoph.com"

echo "🔧 Setting up server for Agriko deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install required Apache2 modules
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod ssl
sudo a2enmod expires
sudo a2enmod deflate

# Create web directory
sudo mkdir -p $WEB_ROOT
sudo chown -R www-data:www-data $WEB_ROOT
sudo chmod -R 755 $WEB_ROOT

# Install Certbot for SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-apache -y

echo "✅ Server setup complete!"
echo "Next steps:"
echo "1. Copy the Apache virtual host configuration to /etc/apache2/sites-available/"
echo "2. Enable the site: sudo a2ensite $DOMAIN.conf"
echo "3. Obtain SSL certificate: sudo certbot --apache -d $DOMAIN"
echo "4. Test Apache config: sudo apache2ctl configtest"
echo "5. Restart Apache: sudo systemctl restart apache2"
```

### Step 5: GitHub Actions CI/CD (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci --production=false
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Build application
      run: npm run build:export
    
    - name: Deploy to server
      uses: burnett01/rsync-deployments@6.0.0
      with:
        switches: -avzr --delete
        path: out/
        remote_path: /var/www/agrikoph.com/
        remote_host: ${{ secrets.DEPLOY_HOST }}
        remote_user: ${{ secrets.DEPLOY_USER }}
        remote_key: ${{ secrets.DEPLOY_KEY }}
    
    - name: Set permissions and reload Apache
      uses: appleboy/ssh-action@v1.0.0
      with:
        host: ${{ secrets.DEPLOY_HOST }}
        username: ${{ secrets.DEPLOY_USER }}
        key: ${{ secrets.DEPLOY_KEY }}
        script: |
          sudo chown -R www-data:www-data /var/www/agrikoph.com
          sudo chmod -R 755 /var/www/agrikoph.com
          sudo systemctl reload apache2
```

## Quick Start Instructions

### For Immediate Deployment:

1. **Update Next.js Config**:
   ```bash
   # Copy the next.config.js configuration provided above
   ```

2. **Make Deploy Script Executable**:
   ```bash
   chmod +x deploy.sh
   ```

3. **Configure Server Details**:
   ```bash
   # Edit deploy.sh and update:
   REMOTE_USER="your-username"
   REMOTE_HOST="your-server-ip"
   ```

4. **Deploy**:
   ```bash
   ./deploy.sh
   ```

### Server Configuration:

1. **Setup Apache Virtual Host**:
   ```bash
   sudo cp shop.agrikoph.com.conf /etc/apache2/sites-available/
   sudo a2ensite shop.agrikoph.com.conf
   sudo systemctl reload apache2
   ```

2. **SSL Certificate**:
   ```bash
   sudo certbot --apache -d shop.agrikoph.com
   ```

## Monitoring and Maintenance

### Log Monitoring:
```bash
# Apache error logs
sudo tail -f /var/log/apache2/shop.agrikoph.com_error.log

# Apache access logs  
sudo tail -f /var/log/apache2/shop.agrikoph.com_access.log
```

### Performance Monitoring:
```bash
# Check site performance
curl -w "@curl-format.txt" -o /dev/null -s "https://shop.agrikoph.com"
```

### Backup Strategy:
- Automated backups before each deployment
- Daily site backups recommended
- Database backups if using dynamic features

## Troubleshooting

### Common Issues:

1. **Permission Errors**:
   ```bash
   sudo chown -R www-data:www-data /var/www/agrikoph.com
   sudo chmod -R 755 /var/www/agrikoph.com
   ```

2. **Apache Configuration**:
   ```bash
   sudo apache2ctl configtest
   sudo systemctl restart apache2
   ```

3. **SSL Issues**:
   ```bash
   sudo certbot renew --dry-run
   ```

This deployment strategy provides a robust, automated solution for your Agriko application while leveraging your existing Apache2 setup.