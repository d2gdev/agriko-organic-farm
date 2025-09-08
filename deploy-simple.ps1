# Simple Agriko Deployment Script for PowerShell
# Quick deployment without interactive prompts

param(
    [switch]$SkipBuild,
    [switch]$NoBackup,
    [string]$Method = "scp"  # scp or rsync
)

# Configuration
$REMOTE_USER = "root"
$REMOTE_HOST = "143.42.189.57"
$REMOTE_PATH = "/var/www/shop"
$BUILD_DIR = "out"

Write-Host "🚀 Starting Agriko deployment..." -ForegroundColor Blue
Write-Host "Server: $REMOTE_USER@$REMOTE_HOST" -ForegroundColor Cyan
Write-Host "Path: $REMOTE_PATH" -ForegroundColor Cyan
Write-Host ""

# Build application (unless skipped)
if (!$SkipBuild) {
    Write-Host "📦 Building application..." -ForegroundColor Yellow
    npm run build:export
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build completed" -ForegroundColor Green
}

# Create backup (unless disabled)
if (!$NoBackup) {
    Write-Host "💾 Creating backup..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupName = "$REMOTE_PATH.backup.$timestamp"
    ssh "$REMOTE_USER@$REMOTE_HOST" "if [ -d '$REMOTE_PATH' ]; then cp -r '$REMOTE_PATH' '$backupName' && echo 'Backup created: $backupName'; else echo 'No existing files to backup'; fi"
    Write-Host "✅ Backup completed" -ForegroundColor Green
}

# Ensure remote directory exists
Write-Host "📁 Preparing remote directory..." -ForegroundColor Yellow
ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_PATH"

# Deploy files
Write-Host "🚀 Deploying files using $Method..." -ForegroundColor Yellow

if ($Method -eq "scp") {
    # Clear destination and copy with scp
    ssh "$REMOTE_USER@$REMOTE_HOST" "rm -rf $REMOTE_PATH/*"
    scp -o StrictHostKeyChecking=no -r "$BUILD_DIR/*" "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_PATH/"
} elseif ($Method -eq "rsync") {
    # Use rsync
    rsync -avz --delete --progress -e "ssh -o StrictHostKeyChecking=no" "$BUILD_DIR/" "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_PATH/"
} else {
    Write-Host "❌ Invalid method: $Method (use 'scp' or 'rsync')" -ForegroundColor Red
    exit 1
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

# Set permissions
Write-Host "🔐 Setting permissions..." -ForegroundColor Yellow
ssh "$REMOTE_USER@$REMOTE_HOST" "chmod -R 755 $REMOTE_PATH"

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "Site URL: https://shop.agrikoph.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "To check deployment:" -ForegroundColor Yellow
Write-Host "  ssh $REMOTE_USER@$REMOTE_HOST `'ls -la $REMOTE_PATH`'" -ForegroundColor Gray
Write-Host "  Invoke-WebRequest https://shop.agrikoph.com" -ForegroundColor Gray