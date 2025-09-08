# Agriko Deployment Script for PowerShell
# PowerShell version for Windows development environment

# Configuration - Updated with your server details
$REMOTE_USER = "root"
$REMOTE_HOST = "143.42.189.57"
$REMOTE_PATH = "/var/www/shop"
$BUILD_DIR = "out"

# Colors for output
function Write-Step {
    param($Message)
    Write-Host "📋 $Message" -ForegroundColor Yellow
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Header {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host "    🚀 AGRIKO DEPLOYMENT SCRIPT 🚀" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host ""
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Step "Checking prerequisites..."
    
    # Check if we're in the right directory
    if (!(Test-Path "package.json")) {
        Write-Error "package.json not found. Are you in the project root?"
        exit 1
    }
    
    # Check if required commands exist
    if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm is not installed or not in PATH"
        exit 1
    }
    
    if (!(Get-Command ssh -ErrorAction SilentlyContinue)) {
        Write-Error "ssh is not installed or not in PATH (try installing OpenSSH or Git for Windows)"
        exit 1
    }
    
    if (!(Get-Command scp -ErrorAction SilentlyContinue)) {
        Write-Error "scp is not installed or not in PATH (try installing OpenSSH or Git for Windows)"
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Function to install dependencies
function Install-Dependencies {
    Write-Step "Installing dependencies..."
    npm ci --production=false
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    Write-Success "Dependencies installed"
}

# Function to run quality checks
function Test-Quality {
    Write-Step "Running quality checks..."
    
    Write-Host "  🧪 Running linter..."
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Linting failed"
        exit 1
    }
    
    Write-Host "  🔍 Running type checking..."
    npm run type-check
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Type checking failed"
        exit 1
    }
    
    Write-Success "Quality checks passed"
}

# Function to build application
function Build-Application {
    Write-Step "Building application..."
    npm run build:export
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        exit 1
    }
    
    # Check if build was successful
    if (!(Test-Path $BUILD_DIR)) {
        Write-Error "Build failed - $BUILD_DIR directory not found"
        exit 1
    }
    
    Write-Success "Application built successfully"
}

# Function to handle existing files and create backup
function Handle-ExistingFiles {
    Write-Step "Checking existing files on server..."
    
    # Check if directory exists and has files
    $fileCountResult = ssh "$REMOTE_USER@$REMOTE_HOST" "if [ -d '$REMOTE_PATH' ]; then find '$REMOTE_PATH' -type f | wc -l; else echo '0'; fi"
    $fileCount = [int]$fileCountResult.Trim()
    
    if ($fileCount -gt 0) {
        Write-Host "Found $fileCount existing files in $REMOTE_PATH" -ForegroundColor Yellow
        Write-Host "What would you like to do with existing files?"
        Write-Host "1) Create backup and replace (recommended)"
        Write-Host "2) Merge with existing files (may cause conflicts)"
        Write-Host "3) Cancel deployment"
        
        do {
            $choice = Read-Host "Choose option (1-3)"
        } while ($choice -notin @('1', '2', '3'))
        
        switch ($choice) {
            '1' {
                Write-Step "Creating backup of existing files..."
                $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
                $backupName = "$REMOTE_PATH.backup.$timestamp"
                ssh "$REMOTE_USER@$REMOTE_HOST" "cp -r '$REMOTE_PATH' '$backupName' && echo 'Backup created: $backupName'"
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "Failed to create backup"
                    exit 1
                }
                Write-Success "Backup created successfully"
            }
            '2' {
                Write-Step "Will merge with existing files..."
                Write-Host "⚠️  Warning: This may overwrite existing files without backup" -ForegroundColor Yellow
            }
            '3' {
                Write-Host "Deployment cancelled."
                exit 0
            }
        }
    } else {
        Write-Step "No existing files found, proceeding with fresh deployment..."
    }
}

# Function to deploy to server
function Deploy-Files {
    Write-Step "Deploying files to server..."
    
    # Ensure remote directory exists
    ssh "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_PATH"
    
    Write-Host "Choose deployment method:"
    Write-Host "1) scp (simple copy, complete transfer - recommended for PowerShell)"
    Write-Host "2) rsync (faster, but may have issues in PowerShell)"
    
    do {
        $method = Read-Host "Choose method (1-2, default: 1)"
        if ([string]::IsNullOrEmpty($method)) { $method = '1' }
    } while ($method -notin @('1', '2'))
    
    if ($method -eq '1') {
        Write-Step "Using scp for deployment..."
        # Clear destination directory first
        ssh "$REMOTE_USER@$REMOTE_HOST" "rm -rf $REMOTE_PATH/*"
        # Use scp to copy all files recursively
        scp -o StrictHostKeyChecking=no -r "$BUILD_DIR/*" "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_PATH/"
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to deploy files with scp"
            exit 1
        }
    } else {
        Write-Step "Using rsync for deployment (experimental in PowerShell)..."
        # Try rsync - may not work well in PowerShell
        rsync -avz --delete --progress -e "ssh -o StrictHostKeyChecking=no" "$BUILD_DIR/" "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_PATH/"
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to deploy files with rsync. Try scp instead."
            exit 1
        }
    }
    
    Write-Success "Files deployed successfully"
}

# Function to set permissions and reload server
function Complete-Deployment {
    Write-Step "Finalizing deployment..."
    
    ssh "$REMOTE_USER@$REMOTE_HOST" @"
        # Set correct ownership and permissions
        chmod -R 755 $REMOTE_PATH
        
        # If Apache is running, try to reload it
        if systemctl is-active --quiet apache2; then
            systemctl reload apache2
            echo 'Apache reloaded'
        else
            echo 'Apache not running or not installed'
        fi
        
        echo 'Server configuration updated'
"@
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to finalize deployment"
        exit 1
    }
    
    Write-Success "Deployment finalized"
}

# Function to verify deployment
function Test-Deployment {
    Write-Step "Verifying deployment..."
    
    # Wait a moment for server to respond
    Start-Sleep -Seconds 2
    
    # Check if site is accessible
    try {
        $response = Invoke-WebRequest -Uri "https://shop.agrikoph.com" -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Success "✨ Deployment successful! Site is live at https://shop.agrikoph.com"
        }
    }
    catch {
        Write-Host "⚠️  Warning: Site may not be immediately available via HTTPS. Checking HTTP..." -ForegroundColor Yellow
        try {
            $httpResponse = Invoke-WebRequest -Uri "http://shop.agrikoph.com" -TimeoutSec 10 -ErrorAction Stop
            if ($httpResponse.StatusCode -eq 200) {
                Write-Host "⚠️  Site accessible via HTTP but not HTTPS. Check SSL configuration." -ForegroundColor Yellow
            }
        }
        catch {
            Write-Error "Site is not accessible. Please check server configuration."
            Write-Host "Troubleshooting tips:"
            Write-Host "1. Check files deployed: ssh $REMOTE_USER@$REMOTE_HOST 'ls -la $REMOTE_PATH'"
            Write-Host "2. Verify Apache is running: ssh $REMOTE_USER@$REMOTE_HOST 'systemctl status apache2'"
            Write-Host "3. Check domain DNS points to $REMOTE_HOST"
        }
    }
}

# Function to display deployment summary
function Show-Summary {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host "         🎉 DEPLOYMENT COMPLETE! 🎉" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Site URL: https://shop.agrikoph.com"
    Write-Host "Deployment time: $(Get-Date)"
    Write-Host ""
    Write-Host "Useful commands:"
    Write-Host "  Monitor logs: ssh $REMOTE_USER@$REMOTE_HOST 'tail -f /var/log/apache2/error.log'"
    Write-Host "  Check status: Invoke-WebRequest https://shop.agrikoph.com"
    Write-Host ""
    Write-Host "Happy deploying! 🚀" -ForegroundColor Green
}

# Main deployment process
function Start-Deployment {
    Write-Header
    
    # Confirmation prompt
    Write-Host "You are about to deploy Agriko to production." -ForegroundColor Yellow
    Write-Host "Server: $REMOTE_USER@$REMOTE_HOST"
    Write-Host "Path: $REMOTE_PATH"
    Write-Host ""
    
    do {
        $confirm = Read-Host "Continue with deployment? (y/N)"
    } while ($confirm -notin @('y', 'Y', 'n', 'N', ''))
    
    if ($confirm -notin @('y', 'Y')) {
        Write-Host "Deployment cancelled."
        exit 0
    }
    
    # Run deployment steps
    try {
        Test-Prerequisites
        Install-Dependencies
        Test-Quality
        Build-Application
        Handle-ExistingFiles
        Deploy-Files
        Complete-Deployment
        Test-Deployment
        Show-Summary
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        exit 1
    }
}

# Handle script interruption
trap {
    Write-Host ""
    Write-Error "Deployment interrupted!"
    exit 1
}

# Run main function
Start-Deployment