# Remote Build Deployment Script for Agriko
# Uploads source code only, builds on server - much faster!

$REMOTE_USER = "root"
$REMOTE_HOST = "143.42.189.57"
$REMOTE_SOURCE = "/var/www/shop-src"
$REMOTE_TARGET = "/var/www/shop"

Write-Host "🚀 Starting remote build deployment..." -ForegroundColor Blue
Write-Host "Strategy: Upload source → Build on server → Deploy" -ForegroundColor Gray
Write-Host ""

# Check if we have the right files
if (!(Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Run from project root." -ForegroundColor Red
    exit 1
}

# Step 1: Upload source code (excluding build files, node_modules, etc.)
Write-Host "📤 Uploading source code..." -ForegroundColor Yellow
Write-Host "Excluding: node_modules, .next, out, .git, etc." -ForegroundColor Gray

# Use rsync for efficient sync (only changed files)
$rsyncCmd = "rsync -avz --delete --exclude-from=.deployignore . ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_SOURCE}/"
Write-Host "Running: $rsyncCmd" -ForegroundColor Gray

try {
    Invoke-Expression $rsyncCmd
    Write-Host "✅ Source code uploaded" -ForegroundColor Green
} catch {
    Write-Host "❌ Source upload failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Build on remote server
Write-Host "🏗️  Building on remote server..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

$buildScript = @"
cd $REMOTE_SOURCE
echo "📦 Installing dependencies..."
npm ci --production=false --silent

echo "🖼️  Optimizing images..."
npm run optimize-images

echo "🏗️  Building application..."
npm run build:export

echo "📊 Build statistics:"
du -sh out/
ls -la out/ | wc -l | xargs echo "Files:"

echo "✅ Build completed on server"
"@

try {
    ssh "$REMOTE_USER@$REMOTE_HOST" $buildScript
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Remote build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Remote build completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Remote build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Deploy built files to web directory
Write-Host "🚀 Deploying to web directory..." -ForegroundColor Yellow

$deployScript = @"
# Create backup
if [ -d '$REMOTE_TARGET' ]; then
    timestamp=\$(date +%Y%m%d-%H%M%S)
    echo "💾 Creating backup: $REMOTE_TARGET.backup.\$timestamp"
    cp -r '$REMOTE_TARGET' '$REMOTE_TARGET.backup.\$timestamp'
fi

# Ensure target directory exists
mkdir -p '$REMOTE_TARGET'

# Clear old files
echo "🧹 Cleaning target directory..."
rm -rf '$REMOTE_TARGET'/*

# Copy new files
echo "📋 Copying build output..."
cp -r '$REMOTE_SOURCE/out'/* '$REMOTE_TARGET'/ 

# Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 '$REMOTE_TARGET'

# Show results
echo "📊 Deployment results:"
du -sh '$REMOTE_TARGET'
ls -la '$REMOTE_TARGET' | wc -l | xargs echo "Files deployed:"

echo "✅ Deployment completed"
"@

try {
    ssh "$REMOTE_USER@$REMOTE_HOST" $deployScript
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Deployment completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Remote build deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "• Source uploaded to: $REMOTE_SOURCE" -ForegroundColor White
Write-Host "• Built on server with optimization" -ForegroundColor White  
Write-Host "• Deployed to: $REMOTE_TARGET" -ForegroundColor White
Write-Host "• Site URL: https://shop.agrikoph.com" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next time, use: npm run deploy:remote" -ForegroundColor Gray