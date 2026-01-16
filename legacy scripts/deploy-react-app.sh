#!/bin/bash

# Deploy React application to EC2 instances
# Run from project root: ./deploy-react-app.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "====================================="
echo "Deploy BrewCraft React Application"
echo "====================================="
echo ""

# Check if build directory exists
if [ ! -d "build" ]; then
    echo -e "${YELLOW}Build directory not found. Building React app...${NC}"
    npm run build
fi

echo -e "${GREEN}Build directory found${NC}"
echo ""

# Get EC2 instance IPs
echo -e "${YELLOW}Getting EC2 instance IPs...${NC}"
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

# Deploy to each instance
for IP in $INSTANCE_IPS; do
    echo "====================================="
    echo -e "${YELLOW}Deploying to instance: $IP${NC}"
    echo "====================================="
    
    # Create tar of build directory
    echo "Creating deployment package..."
    tar -czf build.tar.gz -C build .
    
    # Upload tar file
    echo "Uploading files..."
    scp -i ~/.ssh/labsuser.pem -o StrictHostKeyChecking=no build.tar.gz ec2-user@$IP:/tmp/
    
    # Extract and deploy on instance
    echo "Extracting and deploying..."
    ssh -i ~/.ssh/labsuser.pem -o StrictHostKeyChecking=no ec2-user@$IP << 'ENDSSH'
        # Extract files
        cd /tmp
        tar -xzf build.tar.gz
        
        # Backup old build
        sudo rm -rf /opt/brewcraft/build.old
        sudo mv /opt/brewcraft/build /opt/brewcraft/build.old 2>/dev/null || true
        
        # Move new build
        sudo mkdir -p /opt/brewcraft/build
        sudo mv /tmp/* /opt/brewcraft/build/ 2>/dev/null || true
        sudo chown -R root:root /opt/brewcraft
        sudo chmod -R 755 /opt/brewcraft
        
        # Restart service
        sudo systemctl restart brewcraft
        
        # Check status
        sleep 2
        sudo systemctl status brewcraft --no-pager
        
        # Cleanup
        rm -f /tmp/build.tar.gz
ENDSSH
    
    # Cleanup local tar
    rm -f build.tar.gz
    
    echo -e "${GREEN}Deployed successfully to $IP${NC}"
    echo ""
done

echo "====================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "====================================="
echo ""
echo "Testing ALB..."

# Get ALB DNS
ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name brewcraft-infrastructure \
    --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
    --output text)

echo "ALB DNS: $ALB_DNS"
echo ""
echo "Testing endpoints:"
echo "- Health check: curl http://$ALB_DNS/health"
echo "- Main app: curl http://$ALB_DNS"
echo "- Domain: http://brewcraft.rocks"
echo ""
echo "Wait 30-60 seconds for ALB health checks to pass"
