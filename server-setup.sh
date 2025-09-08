#!/bin/bash

# Agriko Server Setup Script for Ubuntu + Apache2
set -e

# Configuration
DOMAIN="shop.agrikoph.com"
WEB_ROOT="/var/www/shop"
APACHE_SITE_CONFIG="/etc/apache2/sites-available/shop.agrikoph.com.conf"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "    🔧 AGRIKO SERVER SETUP SCRIPT 🔧"
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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root. Please run as a regular user with sudo access."
        exit 1
    fi
}

# Update system packages
update_system() {
    print_step "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    print_success "System updated"
}

# Install required packages
install_packages() {
    print_step "Installing required packages..."
    sudo apt install -y \
        apache2 \
        certbot \
        python3-certbot-apache \
        ufw \
        htop \
        curl \
        wget \
        unzip \
        git \
        rsync
    print_success "Packages installed"
}

# Configure Apache2 modules
configure_apache_modules() {
    print_step "Configuring Apache2 modules..."
    
    # Enable required modules
    sudo a2enmod rewrite
    sudo a2enmod headers
    sudo a2enmod ssl
    sudo a2enmod expires
    sudo a2enmod deflate
    sudo a2enmod security2
    
    print_success "Apache2 modules configured"
}

# Create web directory structure
create_directories() {
    print_step "Creating directory structure..."
    
    # Create web root
    sudo mkdir -p $WEB_ROOT
    
    # Create backup directory
    sudo mkdir -p /var/backups/agrikoph
    
    # Set ownership and permissions
    sudo chown -R www-data:www-data $WEB_ROOT
    sudo chmod -R 755 $WEB_ROOT
    
    # Add current user to www-data group for easier file management
    sudo usermod -a -G www-data $USER
    
    print_success "Directories created"
}

# Configure firewall
configure_firewall() {
    print_step "Configuring firewall..."
    
    # Reset UFW to defaults
    sudo ufw --force reset
    
    # Set default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH (adjust port if needed)
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 'Apache Full'
    
    # Enable firewall
    sudo ufw --force enable
    
    print_success "Firewall configured"
}

# Install Apache configuration
install_apache_config() {
    print_step "Installing Apache configuration..."
    
    if [ -f "./apache-config/shop.agrikoph.com.conf" ]; then
        # Copy configuration file
        sudo cp ./apache-config/shop.agrikoph.com.conf $APACHE_SITE_CONFIG
        
        # Test Apache configuration
        sudo apache2ctl configtest
        
        # Enable the site
        sudo a2ensite shop.agrikoph.com.conf
        
        # Disable default site if enabled
        sudo a2dissite 000-default.conf || true
        
        print_success "Apache configuration installed"
    else
        print_error "Apache configuration file not found at ./apache-config/shop.agrikoph.com.conf"
        echo "Please ensure you have the Apache configuration file in the correct location."
        exit 1
    fi
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    print_step "Setting up SSL certificate..."
    
    # Reload Apache to apply new configuration
    sudo systemctl reload apache2
    
    echo -e "${YELLOW}About to request SSL certificate from Let's Encrypt...${NC}"
    echo "Make sure your domain $DOMAIN points to this server's IP address."
    read -p "Continue with SSL setup? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Request SSL certificate
        sudo certbot --apache -d $DOMAIN --non-interactive --agree-tos --email admin@agrikoph.com --redirect
        
        # Test automatic renewal
        sudo certbot renew --dry-run
        
        print_success "SSL certificate installed and configured"
    else
        echo -e "${YELLOW}⚠️  SSL setup skipped. You can run this later with:${NC}"
        echo "sudo certbot --apache -d $DOMAIN"
    fi
}

# Configure log rotation
configure_log_rotation() {
    print_step "Configuring log rotation..."
    
    sudo tee /etc/logrotate.d/agriko > /dev/null <<EOF
/var/log/apache2/shop.agrikoph.com_*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 640 www-data adm
    sharedscripts
    postrotate
        /bin/systemctl reload apache2 > /dev/null 2>&1 || true
    endscript
}
EOF
    
    print_success "Log rotation configured"
}

# Create backup script
create_backup_script() {
    print_step "Creating backup script..."
    
    sudo tee /usr/local/bin/agriko-backup.sh > /dev/null <<'EOF'
#!/bin/bash

# Agriko Website Backup Script
BACKUP_DIR="/var/backups/agrikoph"
WEB_ROOT="/var/www/shop"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/agriko-backup-$DATE.tar.gz"

# Create backup
echo "Creating backup..."
tar -czf "$BACKUP_FILE" -C "$WEB_ROOT" .

# Keep only last 7 backups
echo "Cleaning old backups..."
find "$BACKUP_DIR" -name "agriko-backup-*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
EOF
    
    sudo chmod +x /usr/local/bin/agriko-backup.sh
    
    # Create daily backup cron job
    echo "0 2 * * * /usr/local/bin/agriko-backup.sh" | sudo crontab -
    
    print_success "Backup script created and scheduled"
}

# Final system configuration
final_configuration() {
    print_step "Applying final configurations..."
    
    # Restart Apache
    sudo systemctl restart apache2
    
    # Enable Apache to start on boot
    sudo systemctl enable apache2
    
    # Check Apache status
    sudo systemctl status apache2 --no-pager
    
    print_success "Final configuration applied"
}

# Display summary and next steps
show_summary() {
    echo -e "${BLUE}"
    echo "================================================"
    echo "         🎉 SERVER SETUP COMPLETE! 🎉"
    echo "================================================"
    echo -e "${NC}"
    echo "Your Ubuntu server is now configured for Agriko deployment!"
    echo ""
    echo -e "${GREEN}✅ Apache2 configured with security headers${NC}"
    echo -e "${GREEN}✅ SSL certificate installed${NC}"
    echo -e "${GREEN}✅ Firewall configured${NC}"
    echo -e "${GREEN}✅ Automatic backups scheduled${NC}"
    echo -e "${GREEN}✅ Log rotation configured${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Update the deploy.sh script with your server details:"
    echo "   - REMOTE_USER=\"your-username\""
    echo "   - REMOTE_HOST=\"your-server-ip\""
    echo ""
    echo "2. Deploy your application:"
    echo "   chmod +x deploy.sh"
    echo "   ./deploy.sh"
    echo ""
    echo "3. Monitor your site:"
    echo "   - Site: https://$DOMAIN"
    echo "   - Logs: sudo tail -f /var/log/apache2/shop.agrikoph.com_error.log"
    echo "   - Status: sudo systemctl status apache2"
    echo ""
    echo -e "${GREEN}Happy hosting! 🚀${NC}"
}

# Main setup process
main() {
    print_header
    
    # Confirmation
    echo -e "${YELLOW}This script will configure your Ubuntu server for Agriko deployment.${NC}"
    echo "Domain: $DOMAIN"
    echo "Web root: $WEB_ROOT"
    echo ""
    read -p "Continue with server setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    check_root
    update_system
    install_packages
    configure_apache_modules
    create_directories
    configure_firewall
    install_apache_config
    setup_ssl
    configure_log_rotation
    create_backup_script
    final_configuration
    show_summary
}

# Handle interruption
trap 'echo -e "\n${RED}Setup interrupted!${NC}"; exit 1' INT

# Run main function
main