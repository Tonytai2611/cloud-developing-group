#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SSH_KEY="$HOME/.ssh/vockey.pem"
AWS_REGION="us-east-1"
ECR_IMAGE="058053292709.dkr.ecr.us-east-1.amazonaws.com/brewcraft:latest"

echo "======================================"
echo "Force Update Docker Containers on EC2"
echo "======================================"
echo ""

# Get running instances
INSTANCE_IPS=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=dev-brewcraft-instance" "Name=instance-state-name,Values=running" \
    --query 'Reservations[*].Instances[*].PublicIpAddress' \
    --output text)

if [ -z "$INSTANCE_IPS" ]; then
    echo -e "${RED}No running instances found${NC}"
    exit 1
fi

echo -e "${GREEN}Found instances: $INSTANCE_IPS${NC}"
echo ""

for IP in $INSTANCE_IPS; do
    echo "======================================"
    echo -e "${YELLOW}Updating $IP...${NC}"
    echo "======================================"
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@$IP << ENDSSH
        set -e
        
        echo "Logging into ECR..."
        aws ecr get-login-password --region ${AWS_REGION} | \
            sudo docker login --username AWS --password-stdin 533266957010.dkr.ecr.${AWS_REGION}.amazonaws.com
        
        echo "Stopping container..."
        sudo docker stop brewcraft-app 2>/dev/null || true
        sudo docker rm brewcraft-app 2>/dev/null || true
        
        echo "Removing old image..."
        sudo docker rmi ${ECR_IMAGE} 2>/dev/null || true
        
        echo "Pulling latest image..."
        sudo docker pull ${ECR_IMAGE}
        
        echo "Starting new container..."
        sudo docker run -d \
            --name brewcraft-app \
            --restart unless-stopped \
            -p 3000:80 \
            ${ECR_IMAGE}
        
        sleep 3
        
        echo "Testing container..."
        curl -f http://localhost:3000/health || echo "Health check warning"
        
        echo "Container updated!"
ENDSSH
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Updated $IP${NC}"
    else
        echo -e "${RED}✗ Failed to update $IP${NC}"
    fi
    echo ""
done

echo "======================================"
echo -e "${GREEN}All instances updated!${NC}"
echo "======================================"
echo ""
echo "Wait 30 seconds for ALB health checks, then test:"
echo "  http://brewcraft.rocks"
