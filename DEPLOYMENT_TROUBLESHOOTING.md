# GitHub Deployment Setup Guide

## Quick Setup Checklist

### 1. GitHub Repository Secrets
Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:

**Server Connection:**
- `SERVER_HOST`: Your server IP or domain name
- `SERVER_USER`: SSH username (usually `root` or your user)
- `SSH_PRIVATE_KEY`: Your SSH private key (see SSH setup below)
- `SERVER_PORT`: SSH port (optional, defaults to 22)

**Application Environment:**
- `NEXT_PUBLIC_WC_API_URL`: Your WooCommerce REST API URL
- `WC_CONSUMER_KEY`: WooCommerce consumer key
- `WC_CONSUMER_SECRET`: WooCommerce consumer secret
- `ADMIN_PASSWORD_HASH`: Hashed admin password
- `JWT_SECRET`: Random string 32+ characters

### 2. SSH Key Setup

**Generate SSH key locally:**
```bash
ssh-keygen -t ed25519 -f ~/.ssh/agriko_deploy
```

**Copy public key to server:**
```bash
ssh-copy-id -i ~/.ssh/agriko_deploy.pub user@your-server.com
```

**Add private key to GitHub secrets:**
```bash
cat ~/.ssh/agriko_deploy
# Copy this entire output to SSH_PRIVATE_KEY secret
```

### 3. Server Preparation

**Install Node.js on server:**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Create app directory:**
```bash
sudo mkdir -p /var/www/agriko
sudo chown $USER:$USER /var/www/agriko
```

### 4. Manual Deployment Test

You can test deployment manually using the "Simple Deploy" workflow:

1. Go to your GitHub repo → Actions tab
2. Click "Simple Deploy" workflow
3. Click "Run workflow" → "Run workflow"

## Troubleshooting Common Issues

### Issue: "Host key verification failed"
**Solution:** Add your server to GitHub's known hosts or disable strict host checking:
```yaml
# In deploy workflow, add to ssh-action:
strict_host_key_checking: false
```

### Issue: "Permission denied (publickey)"
**Solutions:**
1. Check SSH key is correctly added to server's `~/.ssh/authorized_keys`
2. Verify SSH key format in GitHub secrets (include `-----BEGIN OPENSSH PRIVATE KEY-----`)
3. Test SSH connection locally: `ssh -i ~/.ssh/agriko_deploy user@server`

### Issue: "npm: command not found" on server
**Solution:** Install Node.js on your server (see server preparation above)

### Issue: Build fails with environment variable errors
**Solution:** Check all required secrets are added to GitHub with correct names:
- Must use `NEXT_PUBLIC_WC_API_URL` (not `WC_API_URL`)
- Must use `ADMIN_PASSWORD_HASH` (not `ADMIN_PASSWORD`)

### Issue: "Cannot find module" errors during deployment
**Solution:** Ensure `package-lock.json` is committed to your repository

## Alternative: Simple Manual Deployment

If GitHub Actions don't work, you can deploy manually:

```bash
# On your server
cd /var/www/agriko
git pull origin main
npm ci --omit=dev
npm run build

# If using PM2 or systemd
pm2 restart agriko  # or
sudo systemctl restart agriko
```

## Deployment Modes

### Option 1: Static Export (Recommended for simple hosting)
Add to `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true }
}
module.exports = nextConfig
```

Then deploy the `out/` folder to any static hosting.

### Option 2: Node.js Server (For full Next.js features)
Deploy `.next/` folder and run `npm start` on your server.

### Option 3: Docker (Most reliable)
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Testing Your Setup

1. **Test build locally:** `npm run build`
2. **Test SSH connection:** `ssh user@your-server.com`
3. **Test deployment:** Use the "Simple Deploy" workflow
4. **Check logs:** GitHub Actions → Your workflow run → View logs

Need help? Check the specific error messages in GitHub Actions logs for more targeted solutions.