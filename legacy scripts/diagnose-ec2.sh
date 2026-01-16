#!/bin/bash

SSH_KEY="$HOME/.ssh/labsuser.pem"

echo "Checking both EC2 instances..."
echo ""

for IP in "54.81.236.233" "54.89.9.24"; do
    echo "======================================="
    echo "Instance: $IP"
    echo "======================================="
    
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@$IP << 'EOF'
echo "1. Docker containers:"
sudo docker ps -a | grep brewcraft || echo "No brewcraft container found"
echo ""

echo "2. Container logs (last 20 lines):"
sudo docker logs --tail 20 brewcraft-app 2>&1 || echo "No logs available"
echo ""

echo "3. Port 80 check:"
sudo netstat -tlnp | grep :80 || echo "Nothing on port 80"
echo ""

echo "4. Health check:"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost/health || echo "Failed to connect"
echo ""

echo "5. BrewCraft service status:"
sudo systemctl status brewcraft --no-pager | head -10 || echo "Service not found"
EOF
    
    echo ""
done
