# How to Deploy Agriko E-commerce Site

## 📋 Complete Deployment Guide

This document explains how to deploy your Agriko Next.js e-commerce site using the new **Git-based deployment system**.

---

## 🏗️ Architecture Overview

**Deployment Type**: Git + Static Export + Apache2
- **Local**: Windows development environment with Git
- **Server**: Ubuntu 20.04+ with Apache2 serving static files  
- **Domain**: https://shop.agrikoph.com
- **Repository**: https://github.com/d2gdev/agriko-organic-farm
- **Method**: Local build + Git push + Direct file transfer

---

## 🚀 Quick Deployment (2 Minutes)

### Single Command Deployment
```bash
npm run deploy
```

**What this does:**
1. ✅ Builds the static site locally (fast)
2. ✅ Commits & pushes changes to Git (version control)
3. ✅ Uploads built files to server (direct transfer)

### With Quality Checks
```bash
npm run deploy:full
```
Includes linting and type-checking before deployment.

---

## 📋 Available Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run deploy` | Complete deployment | Daily development |
| `npm run deploy:full` | With quality checks | Production releases |
| `npm run deploy:git` | Push source to Git only | Code backup |
| `npm run deploy:files` | Upload files only | After local build |

---

## 🔧 Setup Requirements

### ✅ Prerequisites
- [x] Node.js 18+ installed
- [x] Git configured with GitHub access
- [x] SSH access to server: `root@143.42.189.57`
- [x] Server document root: `/var/www/shop/`

### ✅ First-Time Setup (Already Done)
- [x] Git repository created and connected
- [x] SSH keys or password authentication configured
- [x] Apache2 configured to serve static files
- [x] Deployment scripts configured in package.json

---

## 🚀 Daily Workflow

### 1. Make Changes
Edit your code, add features, fix bugs, etc.

### 2. Test Locally
```bash
npm run dev
```
Preview at http://localhost:3000

### 3. Deploy
```bash
npm run deploy
```

### 4. Verify
Visit http://143.42.189.57 to see your changes live.

---

## 🔍 Troubleshooting

### Common Issues & Solutions

**Issue: "SSH connection failed"**
```bash
# Test SSH connection
ssh root@143.42.189.57 "echo 'Connected successfully'"
```

**Issue: "Git push failed"**
```bash
# Check Git status
git status

# Push manually if needed
git push origin main
```

**Issue: "Build failed"**
```bash
# Clean and rebuild
rm -rf out/ .next/ node_modules/
npm install
npm run build:export
```

**Issue: "Files not uploading"**
```bash
# Manual file upload
scp -r out/* root@143.42.189.57:/var/www/shop/
```

---

## 📊 Deployment Details

### What Gets Built
- 23 static HTML pages
- Optimized JavaScript bundles
- CSS stylesheets
- All images and assets
- Sitemap and SEO files

### Where Files Go
```
Server: root@143.42.189.57
Directory: /var/www/shop/
Web URL: http://143.42.189.57
```

### Typical Deployment Time
- Build: 5-10 seconds
- Git push: 2-5 seconds  
- File upload: 30-60 seconds
- **Total: ~1-2 minutes**

---

## 🆘 Emergency Procedures

### Quick Rollback
```bash
# Go back to previous version
git reset --hard HEAD~1
npm run deploy:files
```

### Manual Recovery
```bash
# List server backups
ssh root@143.42.189.57 "ls -la /var/www/shop.backup.*"

# Restore from backup
ssh root@143.42.189.57 "cp -r /var/www/shop.backup.20250908-201146/* /var/www/shop/"
```

---

## 🎯 Why This Approach?

### ✅ Benefits
- **Fast**: Local building uses your full machine resources
- **Reliable**: Git provides version control and history
- **Simple**: One command deployment
- **Professional**: Industry-standard Git workflow
- **Efficient**: No server-side building required

### 📈 Compared to Previous Methods
| Method | Speed | Reliability | Complexity |
|--------|-------|-------------|------------|
| **Git + SCP** | ⚡ Fast | ✅ Excellent | 🟢 Simple |
| PowerShell Scripts | 🐌 Slow | ⚠️ Complex | 🟡 Medium |
| Manual Upload | 🐌 Very Slow | ❌ Error-prone | 🔴 High |

---

## 📝 Legacy Methods (Still Available)

### PowerShell Deployment
```powershell
.\deploy-quick.ps1
```

### Manual Steps
```bash
npm run build:export
scp -r out/* root@143.42.189.57:/var/www/shop/
```

---

## 📖 Additional Documentation

- **Detailed Guide**: See `DEPLOYMENT_GIT.md` for comprehensive instructions
- **Image Optimization**: See `IMAGE_OPTIMIZATION_AUTOMATED.md`
- **Project Setup**: See `CLAUDE.md` for development guidelines

---

## ✅ Summary

**For daily deployments, just run:**
```bash
npm run deploy
```

**Your website will be updated at:** http://143.42.189.57

**Need help?** Check the troubleshooting section above or refer to `DEPLOYMENT_GIT.md` for detailed instructions.

---

*This deployment system was optimized for speed, reliability, and ease of use. 🚀*