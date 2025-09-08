#!/bin/bash

# Agriko Deployment Script
set -e

# Configuration - Updated with your server details
REMOTE_USER="root"
REMOTE_HOST="143.42.189.57"
REMOTE_PATH="/var/www/shop"
BUILD_DIR="out"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "    🚀 AGRIKO DEPLOYMENT SCRIPT 🚀"
    echo "================================================"
    echo -e "${NC}"
}

print_step() {
    echo -e "${YELLOW}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    # Check if required commands exist
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command_exists rsync; then
        print_error "rsync is not installed"
        exit 1
    fi
    
    if ! command_exists ssh; then
        print_error "ssh is not installed"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    npm ci --production=false
    print_success "Dependencies installed"
}

# Function to run quality checks
run_quality_checks() {
    print_step "Running quality checks..."
    
    echo "  🧪 Running linter..."
    npm run lint
    
    echo "  🔍 Running type checking..."
    npm run type-check
    
    print_success "Quality checks passed"
}

# Function to build application
build_application() {
    print_step "Building application..."
    npm run build:export
    
    # Check if build was successful
    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build failed - $BUILD_DIR directory not found"
        exit 1
    fi
    
    print_success "Application built successfully"
}

# Function to handle existing files and create backup
handle_existing_files() {
    print_step "Checking existing files on server..."
    
    # Check if directory exists and has files
    FILE_COUNT=$(ssh $REMOTE_USER@$REMOTE_HOST "
        if [ -d '$REMOTE_PATH' ]; then
            find '$REMOTE_PATH' -type f | wc -l
        else
            echo '0'
        fi
    ")
    
    if [ "$FILE_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}Found $FILE_COUNT existing files in $REMOTE_PATH${NC}"
        echo "What would you like to do with existing files?"
        echo "1) Create backup and replace (recommended)"
        echo "2) Merge with existing files (may cause conflicts)"
        echo "3) Cancel deployment"
        read -p "Choose option (1-3): " -n 1 -r
        echo
        
        case $REPLY in
            1)
                print_step "Creating backup of existing files..."
                ssh $REMOTE_USER@$REMOTE_HOST "
                    BACKUP_NAME='$REMOTE_PATH.backup.\$(date +%Y%m%d-%H%M%S)'
                    cp -r '$REMOTE_PATH' \"\$BACKUP_NAME\"
                    echo \"Backup created: \$BACKUP_NAME\"
                " || {
                    print_error "Failed to create backup"
                    exit 1
                }
                print_success "Backup created successfully"
                ;;
            2)
                print_step "Will merge with existing files..."
                echo -e "${YELLOW}⚠️  Warning: This may overwrite existing files without backup${NC}"
                ;;
            3)
                echo "Deployment cancelled."
                exit 0
                ;;
            *)
                echo "Invalid option. Deployment cancelled."
                exit 1
                ;;
        esac
    else
        print_step "No existing files found, proceeding with fresh deployment..."
    fi
}

# Function to deploy to server using scp/rsync
deploy_files() {
    print_step "Deploying files to server..."
    
    # Ensure remote directory exists
    ssh $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH"
    
    echo "Choose deployment method:"
    echo "1) rsync (faster, incremental sync - recommended)"
    echo "2) scp (simple copy, complete transfer)"
    read -p "Choose method (1-2, default: 1): " -n 1 -r
    echo
    
    # Default to rsync if no choice made
    if [[ -z "$REPLY" || "$REPLY" =~ ^[1]$ ]]; then
        print_step "Using rsync for deployment..."
        # Use rsync with progress and delete option for clean deployment
        rsync -avz --delete --progress \
            -e "ssh -o StrictHostKeyChecking=no" \
            $BUILD_DIR/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/ || {
            print_error "Failed to deploy files with rsync"
            exit 1
        }
    elif [[ "$REPLY" =~ ^[2]$ ]]; then
        print_step "Using scp for deployment..."
        # Clear destination directory first
        ssh $REMOTE_USER@$REMOTE_HOST "rm -rf $REMOTE_PATH/*"
        # Use scp to copy all files recursively
        scp -o StrictHostKeyChecking=no -r $BUILD_DIR/* $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/ || {
            print_error "Failed to deploy files with scp"
            exit 1
        }
    else
        print_error "Invalid choice. Deployment cancelled."
        exit 1
    fi
    
    print_success "Files deployed successfully"
}

# Function to set permissions and reload server
finalize_deployment() {
    print_step "Finalizing deployment..."
    
    ssh $REMOTE_USER@$REMOTE_HOST "
        # Set correct ownership and permissions
        sudo chown -R www-data:www-data $REMOTE_PATH
        sudo chmod -R 755 $REMOTE_PATH
        
        # Test Apache configuration
        sudo apache2ctl configtest
        
        # Reload Apache
        sudo systemctl reload apache2
        
        echo 'Server configuration updated'
    " || {
        print_error "Failed to finalize deployment"
        exit 1
    }
    
    print_success "Deployment finalized"
}

# Function to verify deployment
verify_deployment() {
    print_step "Verifying deployment..."
    
    # Wait a moment for server to respond
    sleep 2
    
    # Check if site is accessible
    if curl -f -s -o /dev/null --max-time 10 "https://shop.agrikoph.com"; then
        print_success "✨ Deployment successful! Site is live at https://shop.agrikoph.com"
    else
        echo -e "${YELLOW}⚠️  Warning: Site may not be immediately available. Checking HTTP...${NC}"
        if curl -f -s -o /dev/null --max-time 10 "http://shop.agrikoph.com"; then
            echo -e "${YELLOW}⚠️  Site accessible via HTTP but not HTTPS. Check SSL configuration.${NC}"
        else
            print_error "Site is not accessible. Please check server configuration."
            echo "Troubleshooting tips:"
            echo "1. Check Apache error logs: sudo tail -f /var/log/apache2/error.log"
            echo "2. Verify Apache is running: sudo systemctl status apache2"
            echo "3. Check site configuration: sudo apache2ctl -S"
        fi
    fi
}

# Function to display deployment summary
show_summary() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "         🎉 DEPLOYMENT COMPLETE! 🎉"
    echo "================================================"
    echo -e "${NC}"
    echo "Site URL: https://shop.agrikoph.com"
    echo "Deployment time: $(date)"
    echo ""
    echo "Useful commands:"
    echo "  Monitor logs: ssh $REMOTE_USER@$REMOTE_HOST 'sudo tail -f /var/log/apache2/shop.agrikoph.com_error.log'"
    echo "  Check status: curl -I https://shop.agrikoph.com"
    echo ""
    echo -e "${GREEN}Happy deploying! 🚀${NC}"
}

# Main deployment process
main() {
    print_header
    
    # Confirmation prompt
    echo -e "${YELLOW}You are about to deploy Agriko to production.${NC}"
    echo "Server: $REMOTE_USER@$REMOTE_HOST"
    echo "Path: $REMOTE_PATH"
    echo ""
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    # Run deployment steps
    check_prerequisites
    install_dependencies
    run_quality_checks
    build_application
    handle_existing_files
    deploy_files
    finalize_deployment
    verify_deployment
    show_summary
}

# Handle script interruption
trap 'echo -e "\n${RED}Deployment interrupted!${NC}"; exit 1' INT

# Run main function
main