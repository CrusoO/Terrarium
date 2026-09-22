#!/bin/bash

echo "🚀 Terrarium Deployment Script"
echo "================================"
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git not installed"; exit 1; }

echo "✅ Prerequisites check passed"
echo ""

# Ask user for platform
echo "Select deployment platform:"
echo "1) Fly.io (Recommended - Full Docker support)"
echo "2) Railway.app (Easy setup)"
echo "3) Self-hosted VPS"
echo "4) Oracle Cloud Free Tier"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo ""
    echo "📦 Deploying to Fly.io..."
    echo ""
    
    # Check if flyctl is installed
    if ! command -v flyctl &> /dev/null; then
        echo "Installing Fly CLI..."
        curl -L https://fly.io/install.sh | sh
        export PATH="$HOME/.fly/bin:$PATH"
    fi
    
    # Login
    echo "Please login to Fly.io..."
    flyctl auth login
    
    # Launch app
    flyctl launch --name terrarium --region iad --no-deploy
    
    # Add PostgreSQL
    echo "Creating PostgreSQL database..."
    flyctl postgres create --name terrarium-db --region iad
    
    # Add Redis
    echo "Creating Redis instance..."
    flyctl redis create --name terrarium-redis --region iad
    
    # Set secrets
    echo ""
    echo "Please provide your API keys:"
    read -p "Google AI API Key: " google_key
    read -p "AWS Access Key ID: " aws_key
    read -p "AWS Secret Access Key: " aws_secret
    
    flyctl secrets set \
      GOOGLE_API_KEY="$google_key" \
      AWS_ACCESS_KEY_ID="$aws_key" \
      AWS_SECRET_ACCESS_KEY="$aws_secret" \
      AWS_DEFAULT_REGION="us-east-1"
    
    # Deploy
    echo "Deploying..."
    flyctl deploy
    
    # Run migrations
    echo "Running database migrations..."
    flyctl ssh console -C "cd apps/api && alembic upgrade head"
    
    echo ""
    echo "✅ Deployment complete!"
    flyctl open
    ;;
    
  2)
    echo ""
    echo "📦 Deploying to Railway..."
    echo ""
    
    # Check if railway CLI is installed
    if ! command -v railway &> /dev/null; then
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Login
    railway login
    
    # Initialize
    railway init
    
    # Add services
    railway add postgresql
    railway add redis
    
    # Deploy
    railway up
    
    echo ""
    echo "✅ Deployment complete!"
    echo "Visit https://railway.app/dashboard to manage your app"
    ;;
    
  3)
    echo ""
    echo "🖥️  Self-hosted VPS deployment"
    echo ""
    read -p "Enter your VPS IP address: " vps_ip
    read -p "Enter SSH username: " ssh_user
    
    echo "Connecting to VPS..."
    ssh "$ssh_user@$vps_ip" << 'EOF'
      # Install Docker
      sudo apt update
      sudo apt install -y docker.io docker-compose git
      sudo systemctl start docker
      sudo systemctl enable docker
      
      # Clone repository
      cd /opt
      sudo git clone https://github.com/your-org/terrarium.git
      cd terrarium
      
      # Create .env file
      echo "Creating environment file..."
      cat > .env << 'ENVFILE'
DATABASE_URL=postgresql://terrarium:terrarium@postgres:5432/terrarium
REDIS_URL=redis://redis:6379/0
TERRARIUM_MODE=live
ENVFILE
      
      # Start services
      sudo docker-compose -f infra/docker-compose.yml up -d
      
      echo "✅ Services started!"
EOF
    
    echo ""
    echo "✅ Deployment complete!"
    echo "Access your app at: http://$vps_ip:3001"
    ;;
    
  4)
    echo ""
    echo "☁️  Oracle Cloud Free Tier"
    echo ""
    echo "Please follow these steps:"
    echo ""
    echo "1. Sign up at: https://www.oracle.com/cloud/free/"
    echo "2. Create a Compute Instance (VM.Standard.A1.Flex - 4 OCPU, 24GB RAM)"
    echo "3. SSH into the instance"
    echo "4. Run: curl -sSL https://raw.githubusercontent.com/your-org/terrarium/main/scripts/deploy.sh | bash"
    echo ""
    echo "For detailed instructions, see: docs/DEPLOYMENT-GUIDE.md"
    ;;
    
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "🎉 Deployment script finished!"
echo ""
echo "Next steps:"
echo "1. Set up custom domain (optional)"
echo "2. Configure monitoring"
echo "3. Enable backups"
echo ""
echo "For more information, see: docs/DEPLOYMENT-GUIDE.md"
