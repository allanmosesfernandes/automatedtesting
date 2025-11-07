#!/bin/bash

###############################################################################
# Simple EC2 Deployment Script for Playwright Testing Dashboard
#
# This script sets up everything needed to run the dashboard on Ubuntu EC2
#
# Usage:
#   1. SSH into your EC2 instance
#   2. Run: bash deploy-to-ec2.sh
###############################################################################

set -e  # Exit on any error

echo "=========================================="
echo "  Playwright Testing Dashboard Setup"
echo "=========================================="
echo ""

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install system dependencies required by Playwright
echo "📦 Installing system dependencies for Playwright..."
sudo apt install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libatspi2.0-0 \
    libxshmfence1

# Create application directory
APP_DIR="/home/ubuntu/automated-testing"
echo "📁 Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR

# Prompt for deployment method
echo ""
echo "How would you like to deploy the code?"
echo "1) Upload from local machine (you'll use scp separately)"
echo "2) Clone from git repository"
read -p "Enter choice (1 or 2): " DEPLOY_METHOD

if [ "$DEPLOY_METHOD" == "2" ]; then
    read -p "Enter git repository URL: " GIT_REPO
    echo "📥 Cloning repository..."
    git clone $GIT_REPO $APP_DIR
    cd $APP_DIR
else
    echo ""
    echo "⏸️  Please upload your code now using:"
    echo "   scp -r /path/to/automated-testing/* ubuntu@$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):$APP_DIR/"
    echo ""
    read -p "Press Enter when you've finished uploading..."
    cd $APP_DIR
fi

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install chromium
npx playwright install-deps chromium

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production

# HTTP Basic Authentication
AUTH_USERNAME=admin
AUTH_PASSWORD=testadmin123

# Test User Credentials
TEST_USER_EMAIL=testingplaywright@gmail.com
TEST_USER_PASSWORD=testingplaywright@gmail.com

# Google OAuth Credentials
GOOGLE_TEST_EMAIL=printerpixoauthg@gmail.com
GOOGLE_TEST_PASSWORD=All@in123456*

# Default Test Configuration
BASE_URL=https://qa.printerpix.com
TEST_REGION=US
TEST_ENV=qa
EOF

    echo "⚠️  Default credentials created in .env file"
    echo "⚠️  Please update AUTH_PASSWORD before production use!"
fi

# Create systemd service for auto-restart
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/playwright-dashboard.service > /dev/null << EOF
[Unit]
Description=Playwright Testing Dashboard
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=playwright-dashboard
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
echo "🚀 Starting the service..."
sudo systemctl daemon-reload
sudo systemctl enable playwright-dashboard
sudo systemctl start playwright-dashboard

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo "=========================================="
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🌐 Dashboard URL: http://$PUBLIC_IP:3000"
echo "👤 Username: admin"
echo "🔑 Password: testadmin123"
echo ""
echo "📊 Service Management:"
echo "  - Check status: sudo systemctl status playwright-dashboard"
echo "  - View logs:    sudo journalctl -u playwright-dashboard -f"
echo "  - Restart:      sudo systemctl restart playwright-dashboard"
echo "  - Stop:         sudo systemctl stop playwright-dashboard"
echo ""
echo "⚠️  IMPORTANT:"
echo "  1. Update your EC2 Security Group to allow inbound traffic on port 3000"
echo "  2. Change the default password in .env file"
echo "  3. For production, set up SSL/HTTPS with nginx or Caddy"
echo ""
echo "=========================================="
