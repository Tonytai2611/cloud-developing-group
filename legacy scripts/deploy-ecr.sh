#!/bin/bash

# Deploy BrewCraft React App to ECR and EC2
# Usage: ./deploy-ecr.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
AWS_REGION="us-east-1"
ECR_REPO_NAME="brewcraft-frontend"
IMAGE_TAG="latest"
EC2_TAG_NAME="dev-brewcraft-instance"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/labsuser.pem}"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}SSH key not found: $SSH_KEY${NC}"
    echo "Please download your AWS Learner Lab key and place it at:"
    echo "  $HOME/.ssh/labsuser.pem"
    echo ""
    echo "Or set the SSH_KEY environment variable:"
    echo "  export SSH_KEY=/path/to/your/key.pem"
    exit 1
fi

echo "====================================="
echo "Deploy BrewCraft Frontend to ECR"
echo "====================================="
echo ""

# Get AWS account ID
echo -e "${YELLOW}Getting AWS account info...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo -e "${GREEN}AWS Account: ${AWS_ACCOUNT_ID}${NC}"
echo -e "${GREEN}ECR Repository: ${ECR_URI}${NC}"
echo ""

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}Checking ECR repository...${NC}"
aws ecr describe-repositories --repository-names ${ECR_REPO_NAME} --region ${AWS_REGION} 2>/dev/null || \
    aws ecr create-repository \
        --repository-name ${ECR_REPO_NAME} \
        --region ${AWS_REGION} \
        --image-scanning-configuration scanOnPush=true

echo -e "${GREEN}ECR repository ready${NC}"
echo ""

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

echo -e "${GREEN}Logged in successfully${NC}"
echo ""

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
if ! docker build -t ${ECR_REPO_NAME}:${IMAGE_TAG} .; then
    echo -e "${RED}Docker build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Build complete${NC}"
echo ""

# Tag image for ECR
echo -e "${YELLOW}Tagging image...${NC}"
docker tag ${ECR_REPO_NAME}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}

# Push to ECR
echo -e "${YELLOW}Pushing to ECR...${NC}"
if ! docker push ${ECR_URI}:${IMAGE_TAG}; then
    echo -e "${RED}Docker push failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Image pushed successfully!${NC}"
echo -e "${GREEN}Image URI: ${ECR_URI}:${IMAGE_TAG}${NC}"
echo ""

# Deploy to EC2 instances
echo "====================================="
echo -e "${YELLOW}Deploying to EC2 instances...${NC}"
echo "====================================="
echo ""

# Get EC2 instance IPs
INSTANCE_IPS=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=${EC2_TAG_NAME}" "Name=instance-state-name,Values=running" \
    --query 'Reservations[*].Instances[*].PublicIpAddress' \
    --output text)

if [ -z "$INSTANCE_IPS" ]; then
    echo -e "${RED}No running instances found with tag: ${EC2_TAG_NAME}${NC}"
    exit 1
fi

echo -e "${GREEN}Found instances: $INSTANCE_IPS${NC}"
echo ""

# Deploy to each instance
for IP in $INSTANCE_IPS; do
    echo "====================================="
    echo -e "${YELLOW}Deploying to instance: $IP${NC}"
    echo "====================================="
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@$IP << ENDSSH
        set -e
        
        echo "Installing Docker if needed..."
        if ! command -v docker &> /dev/null; then
            sudo yum update -y
            sudo yum install -y docker
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -aG docker ec2-user
        fi
        
        # Ensure Docker is running
        sudo systemctl start docker
        
        echo "Installing AWS CLI if needed..."
        if ! command -v aws &> /dev/null; then
            curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
            unzip -q awscliv2.zip
            sudo ./aws/install
            rm -rf aws awscliv2.zip
        fi
        
        echo "Logging in to ECR..."
        aws ecr get-login-password --region ${AWS_REGION} | \
            sudo docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
        
        echo "Stopping old container..."
        sudo docker stop brewcraft-app 2>/dev/null || true
        sudo docker rm brewcraft-app 2>/dev/null || true
        
        echo "Pulling new image..."
        sudo docker pull ${ECR_URI}:${IMAGE_TAG}
        
        echo "Starting new container..."
        sudo docker run -d \
            --name brewcraft-app \
            --restart unless-stopped \
            -p 80:80 \
            ${ECR_URI}:${IMAGE_TAG}
        
        echo "Waiting for container to start..."
        sleep 5
        
        echo "Container status:"
        sudo docker ps | grep brewcraft-app || echo "Container not running!"
        
        echo "Testing health endpoint..."
        curl -f http://localhost/health || echo "Health check failed"
        
        echo "Cleaning up old images..."
        sudo docker image prune -f
        
        echo "Deployment completed!"
ENDSSH
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Deployed successfully to $IP${NC}"
    else
        echo -e "${RED}✗ Deployment failed to $IP${NC}"
    fi
    echo ""
done

echo "====================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "====================================="
echo ""

# Get ALB DNS
ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name brewcraft-infrastructure \
    --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
    --output text 2>/dev/null)

# Get Route53 domain
ROUTE53_DOMAIN=$(aws route53 list-hosted-zones \
    --query 'HostedZones[?Name==`brewcraft.rocks.`].Name' \
    --output text 2>/dev/null | sed 's/\.$//')

echo "Testing endpoints:"
if [ -n "$ALB_DNS" ]; then
    echo -e "  ${YELLOW}ALB Health:${NC} curl http://$ALB_DNS/health"
    echo -e "  ${YELLOW}ALB App:${NC} http://$ALB_DNS"
fi

if [ -n "$ROUTE53_DOMAIN" ]; then
    echo -e "  ${YELLOW}Domain:${NC} http://$ROUTE53_DOMAIN"
fi

for IP in $INSTANCE_IPS; do
    echo -e "  ${YELLOW}Instance $IP:${NC} http://$IP"
done

echo ""
echo -e "${YELLOW}Note: Wait 30-60 seconds for ALB health checks to pass${NC}"
