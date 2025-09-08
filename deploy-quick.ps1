# Quick Agriko Deployment Script
$REMOTE_USER = "root"
$REMOTE_HOST = "143.42.189.57"
$REMOTE_PATH = "/var/www/shop"
$BUILD_DIR = "out"

Write-Host "🚀 Starting Agriko deployment..." -ForegroundColor Blue
Write-Host "Server: $REMOTE_USER@$REMOTE_HOST"
Write-Host "Path: $REMOTE_PATH"
Write-Host ""

# Build application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build:export
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed" -ForegroundColor Green

# Create backup
Write-Host "💾 Creating backup..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupCmd = "if [ -d '$REMOTE_PATH' ]; then cp -r '$REMOTE_PATH' '$REMOTE_PATH.backup.$timestamp' && echo 'Backup created'; else echo 'No existing files'; fi"
ssh "$REMOTE_USER@$REMOTE_HOST" $backupCmd
Write-Host "✅ Backup completed" -ForegroundColor Green

# Ensure remote directory exists
Write-Host "📁 Preparing remote directory..." -ForegroundColor Yellow
ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_PATH"

# Deploy files using scp
Write-Host "🚀 Deploying files..." -ForegroundColor Yellow
ssh "$REMOTE_USER@$REMOTE_HOST" "rm -rf $REMOTE_PATH/*"
scp -r "$BUILD_DIR/*" "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_PATH/"

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