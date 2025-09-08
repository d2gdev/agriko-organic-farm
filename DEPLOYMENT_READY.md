# 🚀 Ready to Deploy - Your Configuration

## Server Configuration ✅
- **User**: root
- **Host**: 143.42.189.57
- **Path**: /var/www/shop
- **Method**: rsync (recommended) or scp

## Quick Deployment

### Option 1: Automated Script (Recommended)
```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:
1. ✅ Build your application (23 static pages)
2. 🔍 Check for existing files on server
3. 💾 Offer to backup existing files
4. 🚀 Deploy using rsync or scp (your choice)
5. ✅ Verify deployment success

### Option 2: Manual Commands
```bash
# Build the application
npm run build:export

# Deploy with rsync (faster)
rsync -avz --delete --progress out/ root@143.42.189.57:/var/www/shop/

# Or deploy with scp (simpler)
scp -r out/* root@143.42.189.57:/var/www/shop/

# Set permissions (if needed)
ssh root@143.42.189.57 "chmod -R 755 /var/www/shop"
```

## GitHub Actions (Optional)
To enable automatic deployment on git push, add these secrets to your GitHub repository:

**Repository Settings → Secrets and variables → Actions:**
- `DEPLOY_HOST` = `143.42.189.57`
- `DEPLOY_USER` = `root`
- `DEPLOY_PATH` = `/var/www/shop`
- `DEPLOY_SSH_KEY` = Your private SSH key

## Handling Existing Files

When you run the deployment script, you'll get these options:

1. **Create backup and replace** (recommended)
   - Backs up existing files to `/var/www/shop.backup.TIMESTAMP`
   - Completely replaces with new files
   - Safe and clean deployment

2. **Merge with existing files** 
   - Overlays new files on top of existing ones
   - May cause conflicts
   - Use only if you know what you're doing

3. **Cancel deployment**
   - Stops the process if you need to check something first

## What Gets Deployed

Your static export includes:
- ✅ **23 static pages** (homepage, about, contact, faq, find-us, cart, checkout, success)
- ✅ **11 product pages** (all your WooCommerce products)
- ✅ **Optimized assets** (_next/ directory with JS, CSS, images)
- ✅ **SEO files** (sitemap.xml, robots.txt)
- ✅ **All images** (product images, hero images, etc.)

## After Deployment

Your site will be live at: **https://shop.agrikoph.com**

### If you need to configure Apache:
1. Copy the Apache config: `scp apache-config/shop.agrikoph.com.conf root@143.42.189.57:/etc/apache2/sites-available/`
2. Enable the site: `ssh root@143.42.189.57 "a2ensite shop.agrikoph.com.conf && systemctl reload apache2"`

## Troubleshooting

**If deployment fails:**
- Check SSH connection: `ssh root@143.42.189.57`
- Verify directory exists: `ssh root@143.42.189.57 "ls -la /var/www/"`
- Check permissions: `ssh root@143.42.189.57 "ls -la /var/www/shop/"`

**If site doesn't load:**
- Check Apache status: `ssh root@143.42.189.57 "systemctl status apache2"`
- Verify files deployed: `ssh root@143.42.189.57 "ls -la /var/www/shop/"`
- Check domain DNS points to 143.42.189.57

## Ready to Deploy? 🎉

Your deployment is fully configured and ready to go:

```bash
./deploy.sh
```

That's it! Your Agriko e-commerce site will be live in minutes.