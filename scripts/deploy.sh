#!/bin/bash

# Görev Party - Quick Deployment Script
# Bu script projeyi production'a deploy etmenizi kolaylaştırır

set -e

echo "🚀 Görev Party Deployment Script"
echo "================================="

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "\n${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_step "Checking dependencies..."
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed" 
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Prepare socket server for deployment
prepare_socket_server() {
    print_step "Preparing Socket.IO server for deployment..."
    
    # Create socket deployment directory
    if [ ! -d "socket-deploy" ]; then
        mkdir socket-deploy
    fi
    
    # Copy server files
    cp -r server/* socket-deploy/
    
    # Create package.json for socket server
    cat > socket-deploy/package.json << EOF
{
  "name": "gorev-party-socket",
  "version": "1.0.0",
  "description": "Görev Party Socket.IO Server",
  "main": "index.js",
  "scripts": {
    "start": "NODE_ENV=production node index.js",
    "dev": "node index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "socket.io": "^4.7.5",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "keywords": ["socket.io", "real-time", "game"],
  "author": "Your Name",
  "license": "MIT"
}
EOF

    # Create railway.json for Railway deployment
    cat > socket-deploy/railway.json << EOF
{
  "build": {
    "builder": "heroku/nodejs"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
EOF

    print_success "Socket server prepared for deployment"
}

# Update socket client for production
update_socket_client() {
    print_step "Updating socket client configuration..."
    
    # Backup original file
    cp lib/socketClient.ts lib/socketClient.ts.backup
    
    # Ask for production socket URL
    read -p "Enter your Railway/Render socket URL (e.g., https://your-app.up.railway.app): " SOCKET_URL
    
    if [ -z "$SOCKET_URL" ]; then
        print_warning "No socket URL provided, using localhost for now"
        SOCKET_URL="http://localhost:3002"
    fi
    
    # Update environment variable
    echo "NEXT_PUBLIC_SOCKET_URL=$SOCKET_URL" > .env.production.local
    
    print_success "Socket client configuration updated"
    echo "📝 Socket URL set to: $SOCKET_URL"
}

# Deploy to Railway (Socket Server)
deploy_socket_railway() {
    print_step "Deploying Socket.IO server to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not installed. Installing..."
        npm install -g @railway/cli
    fi
    
    cd socket-deploy
    
    # Initialize Railway project if not exists
    if [ ! -f ".railway" ]; then
        print_step "Setting up Railway project..."
        railway new --name gorev-party-socket
    fi
    
    # Deploy
    railway up
    
    # Get the domain
    RAILWAY_DOMAIN=$(railway domain)
    
    print_success "Socket server deployed to Railway!"
    echo "📡 Socket URL: https://$RAILWAY_DOMAIN"
    
    cd ..
    
    # Update the environment variable
    echo "NEXT_PUBLIC_SOCKET_URL=https://$RAILWAY_DOMAIN" > .env.production.local
}

# Deploy to Vercel (Frontend)
deploy_frontend_vercel() {
    print_step "Deploying frontend to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not installed. Installing..."
        npm install -g vercel
    fi
    
    # Build the project
    print_step "Building Next.js project..."
    npm run build
    
    # Deploy to Vercel
    print_step "Deploying to Vercel..."
    vercel --prod
    
    print_success "Frontend deployed to Vercel!"
}

# Alternative: Deploy socket to Render
deploy_socket_render() {
    print_step "Preparing for Render deployment..."
    
    # Create render.yaml
    cat > socket-deploy/render.yaml << EOF
services:
  - type: web
    name: gorev-party-socket
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
EOF

    print_success "Render configuration created!"
    print_warning "Please manually create a Render service and connect your GitHub repo"
    echo "📖 Guide: https://render.com/docs/deploy-node-express-app"
}

# Main deployment flow
main() {
    echo "Choose deployment option:"
    echo "1) Quick deploy (Railway + Vercel)"
    echo "2) Manual setup (prepare files only)"
    echo "3) Deploy socket to Railway only"
    echo "4) Deploy frontend to Vercel only"
    echo "5) Prepare for Render deployment"
    
    read -p "Enter your choice (1-5): " CHOICE
    
    case $CHOICE in
        1)
            check_dependencies
            prepare_socket_server
            deploy_socket_railway
            deploy_frontend_vercel
            ;;
        2)
            check_dependencies
            prepare_socket_server
            update_socket_client
            print_success "Files prepared for manual deployment"
            ;;
        3)
            check_dependencies
            prepare_socket_server
            deploy_socket_railway
            ;;
        4)
            check_dependencies
            deploy_frontend_vercel
            ;;
        5)
            check_dependencies
            prepare_socket_server
            deploy_socket_render
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    print_success "Deployment completed!"
    echo ""
    echo "🎉 Next steps:"
    echo "1. Test your deployed app"
    echo "2. Share the Vercel URL with friends"
    echo "3. Monitor Railway/Render logs for any issues"
    echo ""
    echo "📱 Your app should be live at your Vercel URL!"
}

# Run main function
main
