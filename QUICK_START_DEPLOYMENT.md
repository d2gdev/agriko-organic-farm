# Quick Start Deployment Guide

## 🚀 Deploy Agriko in 5 Minutes

### Option 1: Automated Script Deployment (Recommended)

#### Step 1: Configure Your Server Details
Edit `deploy.sh` and update these lines:
```bash
REMOTE_USER="your-ubuntu-username"    # e.g., "agriko" or "ubuntu"
REMOTE_HOST="your-server-ip"          # e.g., "192.168.1.100"
```

#### Step 2: Run Deployment
```bash
# Make script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh
```

**That's it!** Your site will be live at `https://shop.agrikoph.com`

---

### Option 2: Manual Commands

#### Build and Deploy
```bash
# Install dependencies and build
npm ci --production=false
npm run build:export

# Sync to server (update with your details)
rsync -avz --delete out/ username@your-server:/var/www/agrikoph.com/

# Set permissions on server
ssh username@your-server "
  sudo chown -R www-data:www-data /var/www/agrikoph.com
  sudo chmod -R 755 /var/www/agrikoph.com
  sudo systemctl reload apache2
"
```

---

### First-Time Server Setup

If this is your first deployment, run the server setup script:

```bash
# Make executable
chmod +x server-setup.sh

# Run on your Ubuntu server
./server-setup.sh
```

This will:
- ✅ Configure Apache2 with security headers
- ✅ Install SSL certificate (Let's Encrypt)
- ✅ Set up firewall
- ✅ Configure automatic backups
- ✅ Set up log rotation

---

## GitHub Actions Auto-Deployment

### Step 1: Add Repository Secrets

Go to GitHub → Settings → Secrets → Actions and add:

```
DEPLOY_HOST=your-server-ip
DEPLOY_USER=your-ubuntu-username
DEPLOY_PATH=/var/www/agrikoph.com
DEPLOY_SSH_KEY=your-private-ssh-key
```

### Step 2: Enable Auto-Deploy

Push to `main` branch = automatic deployment! 🎉

---

## Troubleshooting

### Common Issues:

1. **Permission Denied**
   ```bash
   ssh username@your-server "sudo chown -R www-data:www-data /var/www/agrikoph.com"
   ```

2. **Site Not Loading**
   ```bash
   # Check Apache status
   ssh username@your-server "sudo systemctl status apache2"
   
   # Check logs
   ssh username@your-server "sudo tail -f /var/log/apache2/shop.agrikoph.com_error.log"
   ```

3. **SSL Issues**
   ```bash
   # Renew certificate
   ssh username@your-server "sudo certbot renew"
   ```

---

## Monitoring Commands

```bash
# Check site status
curl -I https://shop.agrikoph.com

# Monitor real-time logs
ssh username@your-server "sudo tail -f /var/log/apache2/shop.agrikoph.com_access.log"

# Check server resources
ssh username@your-server "htop"
```

---

## Files You Need to Update

Before deployment, update these files with your server details:

1. **`deploy.sh`** - Update `REMOTE_USER` and `REMOTE_HOST`
2. **`package.json`** - Update the `deploy:sync` script URL
3. **GitHub Secrets** - Add your server credentials (if using CI/CD)

That's it! Your Agriko e-commerce site will be deployed with:
- ⚡ Optimized static files
- 🔒 SSL security
- 📈 Performance headers
- 🛡️ Security headers
- 💾 Automatic backups