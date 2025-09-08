# 🚀 Git-Based Deployment Guide for Agriko

## Overview

The Agriko website now uses a **streamlined Git-based deployment system** that combines the best of version control with efficient static file deployment. This approach is fast, reliable, and follows industry best practices.

## 🎯 Quick Deployment

### One-Command Deployment
```bash
npm run deploy
```

This single command:
1. **Builds** the static site locally
2. **Commits & pushes** source changes to Git 
3. **Uploads** built files directly to the server

## 📋 Available Commands

### Main Deployment Commands
```bash
# Complete deployment pipeline
npm run deploy

# Full deployment with quality checks
npm run deploy:full

# Individual steps (if needed)
npm run deploy:git        # Push source changes to Git
npm run deploy:files      # Upload built files to server
```

### Development Commands  
```bash
# Local development
npm run dev

# Build locally
npm run build:export

# Image optimization
npm run optimize-images
```

## 🏗️ How It Works

### 1. Local Build Process
```bash
npm run build:export
```
- Builds static HTML, CSS, JavaScript
- Generates 23 optimized pages
- Creates `out/` directory with deployable files
- Uses your development machine's full resources

### 2. Git Source Management
```bash
npm run deploy:git
```
- Commits all source code changes
- Pushes to GitHub repository: `github.com/d2gdev/agriko-organic-farm`
- Maintains complete version history
- Enables collaboration and rollbacks

### 3. File Upload to Server
```bash
npm run deploy:files
```
- Uses SCP to transfer built files
- Uploads only the `out/` directory contents
- Destination: `root@143.42.189.57:/var/www/shop/`
- Fast direct transfer (no server processing needed)

## 🔧 Setup Requirements

### Local Development Machine
- Node.js 18+ and npm
- Git configured with GitHub access
- SSH access to deployment server

### Server Requirements
- SSH access as root
- Apache2 web server
- Document root: `/var/www/shop/`
- **No Node.js required on server** ✅

## 📁 Project Structure

```
Local Development:
├── src/                    # Source code
├── public/                 # Static assets  
├── out/                    # Built files (generated)
├── package.json           # Dependencies & scripts
└── .git/                  # Git repository

Server Structure:
├── /var/www/shop/         # Web document root (deployed files)
├── /var/www/shop-git/     # Git repository clone (source)
└── /var/www/shop.backup.* # Automatic backups
```

## 🚀 Step-by-Step Deployment

### First Time Setup
1. **Ensure SSH access works:**
   ```bash
   ssh root@143.42.189.57
   ```

2. **Test Git connectivity:**
   ```bash
   git push
   ```

3. **Run first deployment:**
   ```bash
   npm run deploy
   ```

### Daily Development Workflow
1. **Make your changes** to source code
2. **Test locally:**
   ```bash
   npm run dev
   ```
3. **Deploy when ready:**
   ```bash
   npm run deploy
   ```

### Quality Assurance Deployment
```bash
npm run deploy:full
```
This includes:
- ESLint code quality checks
- TypeScript type checking
- Complete build process
- Git commit and push
- File upload to server

## 🔍 Troubleshooting

### Common Issues

**1. SSH Connection Problems**
```bash
# Test SSH connection
ssh root@143.42.189.57 "echo 'Connection successful'"

# If using password authentication, ensure it's enabled
```

**2. Git Push Failures**
```bash
# Check Git status
git status

# Check remote configuration  
git remote -v

# Force push if needed (use carefully)
git push --force-with-lease
```

**3. Build Failures**
```bash
# Clean and rebuild
rm -rf out/ .next/
npm ci
npm run build:export
```

**4. File Upload Timeouts**
```bash
# Upload files manually if needed
scp -r out/* root@143.42.189.57:/var/www/shop/

# Check server disk space
ssh root@143.42.189.57 "df -h"
```

### Verification Steps

**1. Check Local Build:**
```bash
# Verify build output
ls -la out/
open out/index.html  # Preview locally
```

**2. Check Git Repository:**
```bash
# Verify latest commit
git log --oneline -5

# Check repository on GitHub
open https://github.com/d2gdev/agriko-organic-farm
```

**3. Check Server Deployment:**
```bash
# Verify files on server
ssh root@143.42.189.57 "ls -la /var/www/shop/ | head -10"

# Check website accessibility
curl -I http://143.42.189.57
```

## 📊 Deployment Statistics

**Typical Deployment Time:**
- Build: ~5-10 seconds
- Git push: ~2-5 seconds  
- File upload: ~30-60 seconds (depending on changes)
- **Total: ~1-2 minutes**

**Files Deployed:**
- 23 static HTML pages
- Optimized CSS and JavaScript bundles  
- All static assets (images, icons, etc.)
- Sitemap and robots.txt

## 🔒 Security & Best Practices

### Version Control
- ✅ All source code tracked in Git
- ✅ Commit messages describe changes
- ✅ Full deployment history available
- ✅ Easy rollback capability

### File Management  
- ✅ Built files separate from source
- ✅ No sensitive data in repository
- ✅ Environment-specific configs excluded
- ✅ Automatic server backups

### Server Security
- ✅ SSH key authentication recommended
- ✅ Regular server updates
- ✅ Apache security headers configured
- ✅ File permissions properly set

## 🆘 Emergency Procedures

### Quick Rollback
If deployment causes issues:

1. **Check last working commit:**
   ```bash
   git log --oneline -5
   ```

2. **Reset to previous version:**
   ```bash
   git reset --hard HEAD~1
   npm run deploy:files
   ```

3. **Or restore from server backup:**
   ```bash
   ssh root@143.42.189.57 "cp -r /var/www/shop.backup.* /var/www/shop/"
   ```

### Manual File Recovery
```bash
# List available backups
ssh root@143.42.189.57 "ls -la /var/www/shop.backup.*"

# Restore specific backup
ssh root@143.42.189.57 "cp -r /var/www/shop.backup.20250908-201146/* /var/www/shop/"
```

## 🚀 Advanced Usage

### Deploying Specific Branches
```bash
# Switch to feature branch
git checkout feature-branch

# Deploy feature branch
npm run deploy

# Switch back to main
git checkout main
```

### Environment-Specific Deployments
```bash
# Production deployment (default)
npm run deploy

# Staging deployment (if configured)
DEPLOY_ENV=staging npm run deploy
```

### Automated Deployments
Consider setting up GitHub Actions for automatic deployments:
- Trigger on push to main branch
- Run tests before deployment  
- Deploy automatically on success

## 📈 Performance Benefits

### Compared to Previous Methods:

| Method | Build Time | Upload Time | Server Load | Reliability |
|--------|------------|-------------|-------------|-------------|
| **Git + SCP** | Fast | Fast | None | Excellent |
| Remote Build | N/A | Slow | High | Poor (memory issues) |
| Manual Upload | Fast | Very Slow | None | Manual errors |
| Complex Scripts | Fast | Medium | None | Complex failures |

### Why This Approach Works Best:

1. **Local Building** - Uses your development machine's resources
2. **Git Version Control** - Professional source code management  
3. **Direct File Transfer** - No server-side processing needed
4. **Simple & Reliable** - Fewer moving parts, fewer failures

## 🎯 Summary

The new Git-based deployment system provides:

✅ **Fast deployments** (~1-2 minutes total)  
✅ **Professional workflow** with Git version control  
✅ **Server efficiency** (no Node.js building required)  
✅ **Easy troubleshooting** with clear separation of concerns  
✅ **Rollback capability** for emergency situations  
✅ **Scalable approach** that works for teams  

---

## 🔧 Quick Reference

```bash
# Daily deployment
npm run deploy

# With quality checks  
npm run deploy:full

# Emergency rollback
git reset --hard HEAD~1 && npm run deploy:files

# Check deployment
ssh root@143.42.189.57 "ls -la /var/www/shop/ | head -5"
```

**Server:** 143.42.189.57  
**Web Root:** `/var/www/shop/`  
**Repository:** `github.com/d2gdev/agriko-organic-farm`  
**Documentation:** This file 📋