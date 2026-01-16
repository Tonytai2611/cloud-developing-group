#!/bin/bash

# Quick check script
SSH_KEY="$HOME/.ssh/labsuser.pem"
IP="54.81.236.233"

echo "Checking EC2 instance: $IP"
echo "================================"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@$IP << 'EOF'
echo "Docker installed:"
command -v docker && docker --version || echo "Not installed"
echo ""

echo "Docker containers:"
sudo docker ps -a 2>/dev/null || echo "Docker not running or not installed"
echo ""

echo "Port 80 status:"
sudo netstat -tlnp | grep :80 || echo "Nothing listening on port 80"
echo ""

echo "Testing localhost:"
curl -s -I http://localhost/ | head -5 || echo "No response from localhost"
EOF
