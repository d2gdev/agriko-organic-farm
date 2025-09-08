# Setup Image Optimization for Agriko
# Installs required tools and dependencies

Write-Host "🖼️  Setting up image optimization for Agriko..." -ForegroundColor Blue

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (!$isAdmin) {
    Write-Host "⚠️  For best results, run as Administrator to install system tools" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow

# Install required npm packages
$packages = @(
    "sharp",
    "glob", 
    "fs-extra"
)

foreach ($package in $packages) {
    Write-Host "  Installing $package..." -ForegroundColor Gray
    npm install --save-dev $package
}

Write-Host "✅ Node.js dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 Setting up ImageMagick (for PowerShell script)..." -ForegroundColor Yellow

# Check if ImageMagick is available
try {
    $magickVersion = magick -version 2>$null
    Write-Host "✅ ImageMagick already installed" -ForegroundColor Green
}
catch {
    Write-Host "📥 ImageMagick not found. Installing options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1 - Chocolatey (if installed):"
    Write-Host "  choco install imagemagick" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2 - Scoop (if installed):"
    Write-Host "  scoop install imagemagick" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 3 - Manual download:"
    Write-Host "  https://imagemagick.org/script/download.php#windows" -ForegroundColor Gray
    Write-Host ""
    
    if ($isAdmin) {
        $install = Read-Host "Install ImageMagick via Chocolatey? (y/N)"
        if ($install -eq 'y' -or $install -eq 'Y') {
            try {
                choco install imagemagick -y
                Write-Host "✅ ImageMagick installed via Chocolatey" -ForegroundColor Green
            }
            catch {
                Write-Host "❌ Chocolatey not found or installation failed" -ForegroundColor Red
                Write-Host "Please install manually from the link above" -ForegroundColor Yellow
            }
        }
    }
}

Write-Host ""
Write-Host "📁 Creating directories..." -ForegroundColor Yellow

# Ensure scripts directory exists
if (!(Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts"
    Write-Host "✅ Created scripts directory" -ForegroundColor Green
}

# Ensure public/optimized directory exists  
if (!(Test-Path "public/optimized")) {
    New-Item -ItemType Directory -Path "public/optimized" -Force
    Write-Host "✅ Created public/optimized directory" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Image optimization setup complete!" -ForegroundColor Blue
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "• npm run optimize-images    - Run build-time optimization" -ForegroundColor White
Write-Host "• npm run build:optimized    - Build with optimized images" -ForegroundColor White
Write-Host "• .\optimize-images.ps1      - PowerShell optimization script" -ForegroundColor White
Write-Host "• npm run deploy:optimized   - Deploy with optimization" -ForegroundColor White
Write-Host ""
Write-Host "📖 See IMAGE_OPTIMIZATION.md for detailed usage instructions" -ForegroundColor Gray

# Test the setup
Write-Host ""
Write-Host "🧪 Testing setup..." -ForegroundColor Yellow

try {
    # Test Node.js optimization
    Write-Host "  Testing Node.js optimization..." -ForegroundColor Gray
    $nodeTest = node -e "console.log('Sharp:', require('sharp')); console.log('✅ Node.js optimization ready');"
    
    # Test PowerShell optimization  
    if (Get-Command magick -ErrorAction SilentlyContinue) {
        Write-Host "  Testing PowerShell optimization..." -ForegroundColor Gray
        Write-Host "✅ PowerShell optimization ready" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PowerShell optimization requires ImageMagick" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🎉 Setup validation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Quick start:" -ForegroundColor Cyan
    Write-Host "1. Run: npm run optimize-images" -ForegroundColor White
    Write-Host "2. Review optimized images in public/optimized/" -ForegroundColor White
    Write-Host "3. Update components to use OptimizedImage component" -ForegroundColor White
    Write-Host "4. Deploy: npm run deploy:optimized" -ForegroundColor White
    
} catch {
    Write-Host "❌ Setup test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check the error and try installing missing dependencies" -ForegroundColor Yellow
}