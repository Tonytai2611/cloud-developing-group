#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

AWS_REGION="us-east-1"
ECR_IMAGE="533266957010.dkr.ecr.us-east-1.amazonaws.com/brewcraft-frontend:latest"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/labsuser.pem}"

# EC2 instance IPs
INSTANCES=("54.81.236.233" "54.89.9.24")

echo "====================================="
echo "Deploy to EC2 Instances"
echo "====================================="
echo ""

for IP in "${INSTANCES[@]}"; do
    echo -e "${YELLOW}Deploying to $IP...${NC}"
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@$IP << ENDSSH
        set -e
        
        echo "Stopping old BrewCraft service..."
        sudo systemctl stop brewcraft 2>/dev/null || true
        sudo systemctl disable brewcraft 2>/dev/null || true
        
        echo "Installing Docker if needed..."
        if ! command -v docker &> /dev/null; then
            sudo yum update -y
            sudo yum install -y docker
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -aG docker ec2-user
        fi
        
        sudo systemctl start docker
        
    
        
        echo "Logging in to ECR..."
        aws ecr get-login-password --region ${AWS_REGION} | \
            sudo docker login --username AWS --password-stdin 533266957010.dkr.ecr.${AWS_REGION}.amazonaws.com
        
        echo "Stopping old container..."
        sudo docker stop brewcraft-app 2>/dev/null || true
        sudo docker rm brewcraft-app 2>/dev/null || true
        
        echo "Pulling new image..."
        sudo docker pull ${ECR_IMAGE}
        
        echo "Starting new container..."
        sudo docker run -d \
            --name brewcraft-app \
            --restart unless-stopped \
            -p 3000:80 \
            ${ECR_IMAGE}
        
        sleep 5
        
        echo "Container status:"
        sudo docker ps | grep brewcraft-app
        
        echo "Testing health..."
        curl -f http://localhost/health || echo "Health check failed"
        
        echo "Cleaning up old images..."
        sudo docker image prune -f
ENDSSH
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Deployed to $IP${NC}"
    else
        echo -e "${RED}✗ Failed to deploy to $IP${NC}"
    fi
    echo ""
done

echo "====================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "====================================="
echo ""
echo "Test your deployment:"
echo "  ALB: http://dev-brewcraft-alb-852606234.us-east-1.elb.amazonaws.com"
echo "  Instance 1: http://54.81.236.233"
echo "  Instance 2: http://54.89.9.24"
echo ""
echo "Wait 30-60 seconds for ALB health checks"
