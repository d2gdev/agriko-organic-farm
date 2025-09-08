# How to Deploy Agriko E-commerce Site

## 📋 Complete Deployment Guide

This document explains how to deploy your Agriko Next.js e-commerce site to your Ubuntu server running Apache2.

---

## 🏗️ Architecture Overview

**Deployment Type**: Static Export + Apache2
- **Local**: Windows development environment with PowerShell
- **Server**: Ubuntu 20.04+ with Apache2 serving static files
- **Domain**: https://shop.agrikoph.com
- **Method**: Static file generation + SCP/rsync deployment

---

## 🚀 Quick Deployment (5 Minutes)

### Prerequisites
- ✅ Node.js and npm installed locally
- ✅ SSH access to your server (`root@143.42.189.57`)
- ✅ Apache2 configured on server

### Step 1: Build the Application
```powershell
# In your project directory (C:\Users\Sean\Documents\Agriko)
npm run build:export
```
**What this does**: Generates 23 static HTML pages in the `out/` directory

### Step 2: Deploy to Server
```powershell
# Option A: Quick deployment (manual password entry)
scp -r out/* root@143.42.189.57:/var/www/shop/

# Option B: With backup first
ssh root@143.42.189.57 "cp -r /var/www/shop /var/www/shop.backup.$(date +%Y%m%d-%H%M%S)"
scp -r out/* root@143.42.189.57:/var/www/shop/
```

### Step 3: Set Permissions
```powershell
ssh root@143.42.189.57 "chmod -R 755 /var/www/shop"
```

**Done!** Your site is now live at https://shop.agrikoph.com

---

## 🤖 Automated Deployment Scripts

### Method 1: PowerShell Script (Recommended)
```powershell
# Run the automated deployment
.\deploy-quick.ps1
```

**Features**:
- ✅ Builds application automatically
- ✅ Creates timestamped backups
- ✅ Deploys via SCP
- ✅ Sets correct permissions
- ✅ Shows success/error status

### Method 2: Full Interactive Script
```powershell
.\deploy.ps1
```

**Features**:
- ✅ Quality checks (linting, type-checking)
- ✅ Interactive backup options
- ✅ Choice between SCP/rsync
- ✅ Deployment verification
- ✅ Error handling and rollback

---

## 📁 Server Configuration

### Server Details
- **User**: `root`
- **Host**: `143.42.189.57`
- **Web Root**: `/var/www/shop`
- **Apache Config**: `/etc/apache2/sites-available/shop-443.conf`
- **SSL**: Let's Encrypt certificate

### Directory Structure on Server
```
/var/www/shop/
├── index.html              # Homepage
├── _next/                  # Next.js assets (JS, CSS, images)
├── about/                  # About page
├── cart/                   # Shopping cart
├── checkout/               # Checkout flow  
├── contact/                # Contact page
├── product/                # Product pages directory
│   ├── honey/
│   ├── black-rice/
│   └── ... (11 total products)
├── success/                # Order success page
├── sitemap.xml            # SEO sitemap
├── robots.txt             # SEO robots file
└── [images and assets]    # Product images, logos, etc.
```

---

## 🔧 Manual Deployment Steps (Detailed)

### 1. Prepare Local Build
```powershell
# Navigate to project directory
cd C:\Users\Sean\Documents\Agriko

# Install/update dependencies
npm ci --production=false

# Run quality checks (optional but recommended)
npm run lint
npm run type-check

# Build for production
npm run build:export
```

### 2. Handle Existing Files on Server
```powershell
# Check what's currently on server
ssh root@143.42.189.57 "ls -la /var/www/shop"

# Create backup if files exist
ssh root@143.42.189.57 "cp -r /var/www/shop /var/www/shop.backup.$(date +%Y%m%d-%H%M%S)"

# Clear existing files (optional - for clean deployment)
ssh root@143.42.189.57 "rm -rf /var/www/shop/*"
```

### 3. Deploy Files
```powershell
# Method A: Using SCP (recommended for PowerShell)
scp -r out/* root@143.42.189.57:/var/www/shop/

# Method B: Using rsync (if available)
rsync -avz --delete out/ root@143.42.189.57:/var/www/shop/
```

### 4. Set Permissions and Test
```powershell
# Set correct permissions
ssh root@143.42.189.57 "chmod -R 755 /var/www/shop"

# Test the site
curl -I https://shop.agrikoph.com
```

---

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Build Failures
```bash
# Error: Module not found
npm ci --production=false
npm run build:export

# Error: TypeScript errors
npm run type-check
# Fix any type errors, then rebuild
```

#### 2. SSH/SCP Connection Issues
```powershell
# Test SSH connection first
ssh root@143.42.189.57

# If using keys, ensure proper format (not .ppk)
# Convert .ppk to OpenSSH format using PuTTYgen if needed

# Use password authentication as fallback
scp -o PasswordAuthentication=yes -r out/* root@143.42.189.57:/var/www/shop/
```

#### 3. Site Not Loading
```powershell
# Check Apache status
ssh root@143.42.189.57 "systemctl status apache2"

# Check Apache configuration
ssh root@143.42.189.57 "apache2ctl configtest"

# Reload Apache if needed
ssh root@143.42.189.57 "systemctl reload apache2"

# Check deployed files
ssh root@143.42.189.57 "ls -la /var/www/shop"
```

#### 4. Page Not Found (404) Errors
- **Issue**: Next.js static export uses trailing slashes
- **Solution**: Access pages with trailing slash: `/about/` not `/about`
- **Fixed**: Apache config handles this automatically

#### 5. Images Not Loading
```powershell
# Check if images were deployed
ssh root@143.42.189.57 "ls -la /var/www/shop/ | grep jpg"

# Verify permissions
ssh root@143.42.189.57 "chmod -R 755 /var/www/shop"
```

---

## 📊 Deployment Verification Checklist

After deployment, verify these URLs return **200 OK**:

- ✅ **Homepage**: https://shop.agrikoph.com
- ✅ **About**: https://shop.agrikoph.com/about/
- ✅ **Products**: https://shop.agrikoph.com/product/honey/
- ✅ **Cart**: https://shop.agrikoph.com/cart/
- ✅ **Contact**: https://shop.agrikoph.com/contact/
- ✅ **SEO**: https://shop.agrikoph.com/sitemap.xml
- ✅ **SEO**: https://shop.agrikoph.com/robots.txt

**Test Command**:
```powershell
curl -I https://shop.agrikoph.com
# Should return: HTTP/1.1 200 OK
```

---

## 🔄 CI/CD Automation (Optional)

### GitHub Actions Setup
If you want automatic deployment on git push:

1. **Add Repository Secrets** (GitHub Settings → Secrets):
   - `DEPLOY_HOST`: `143.42.189.57`
   - `DEPLOY_USER`: `root`  
   - `DEPLOY_PATH`: `/var/www/shop`
   - `DEPLOY_SSH_KEY`: Your private SSH key (OpenSSH format)

2. **Push to main branch** → Automatic deployment! 🎉

---

## 📦 What Gets Deployed

Your static export includes:

### Pages (23 total)
- **Homepage**: Product showcase and hero section
- **Product Pages**: 11 individual WooCommerce product pages
- **E-commerce**: Cart, checkout, success pages  
- **Content**: About, contact, FAQ, find-us pages
- **Error**: 404 page

### Assets
- **JavaScript**: Optimized Next.js bundles (~102KB shared)
- **CSS**: Tailwind CSS compiled and minified
- **Images**: All product images, logos, hero images
- **Fonts**: Web font files
- **SEO**: sitemap.xml, robots.txt

### Performance
- **Total Size**: ~18MB (including all images)
- **Page Load**: < 2 seconds (static files)
- **Caching**: 1 year cache for assets, optimized headers
- **SEO**: Full meta tags, Open Graph, structured data

---

## 🚀 Future Deployments

For ongoing updates:

### Quick Update (Most Common)
```powershell
# Build and deploy in one go
npm run build:export && scp -r out/* root@143.42.189.57:/var/www/shop/
```

### Full Update with Backup
```powershell
# Use the automated script
.\deploy-quick.ps1
```

### Content-Only Updates
```powershell
# If only content changed, skip build
scp -r out/* root@143.42.189.57:/var/www/shop/
```

---

## 💡 Pro Tips

1. **Always backup before deploying**: The scripts do this automatically
2. **Test locally first**: `npm run dev` to verify changes
3. **Use static export**: Faster and more reliable than SSR for e-commerce
4. **Monitor Apache logs**: `ssh root@143.42.189.57 "tail -f /var/log/apache2/error.log"`
5. **Keep deployment simple**: Static files are easier to manage than servers

---

## 📞 Support

If you encounter issues:

1. **Check build logs**: Look for errors in `npm run build:export`
2. **Verify SSH access**: `ssh root@143.42.189.57`
3. **Test Apache config**: `ssh root@143.42.189.57 "apache2ctl configtest"`
4. **Check file permissions**: `ssh root@143.42.189.57 "ls -la /var/www/shop"`
5. **Monitor site**: https://shop.agrikoph.com

**Your Agriko e-commerce deployment is production-ready! 🌱🚀**