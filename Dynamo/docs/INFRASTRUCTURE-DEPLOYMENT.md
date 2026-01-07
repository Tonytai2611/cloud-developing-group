# BrewCraft Infrastructure - Deployment Guide

## Prerequisites

### 1. Get Route53 Hosted Zone ID
```bash
aws route53 list-hosted-zones --query "HostedZones[?Name=='brewcraft.rocks.'].Id" --output text
```

### 2. Create EC2 Key Pair (if not exists)
```bash
aws ec2 create-key-pair --key-name brewcraft-keypair --query 'KeyMaterial' --output text > brewcraft-keypair.pem
chmod 400 brewcraft-keypair.pem
```

### 3. Update Parameters File
Edit `parameters.yaml`:
- Replace `HostedZoneId` with your actual Hosted Zone ID
- Replace `KeyPairName` with your key pair name (if different)

## Deployment

### Option 1: Using AWS CLI
```bash
cd Dynamo/cloudformation

# Validate template
aws cloudformation validate-template --template-body file://main-infrastructure.yaml

# Create stack
aws cloudformation create-stack \
  --stack-name brewcraft-infrastructure \
  --template-body file://main-infrastructure.yaml \
  --parameters file://parameters.yaml \
  --capabilities CAPABILITY_IAM

# Monitor deployment
aws cloudformation describe-stacks \
  --stack-name brewcraft-infrastructure \
  --query 'Stacks[0].StackStatus'

# Get outputs
aws cloudformation describe-stacks \
  --stack-name brewcraft-infrastructure \
  --query 'Stacks[0].Outputs'

# Upload failover pages to S3
cd failover-page
chmod +x upload-to-s3.sh
./upload-to-s3.sh
```

### Option 2: Using Deploy Script
```bash
cd Dynamo/cloudformation
./deploy.sh
```

## Deployment Time
- VPC and Networking: 2-3 minutes
- Load Balancer: 3-4 minutes
- EC2 Auto Scaling: 5-7 minutes
- Route53 DNS propagation: 5-10 minutes
- **Total: 15-25 minutes**

## Verification

### 1. Check Stack Status
```bash
aws cloudformation describe-stack-events \
  --stack-name brewcraft-infrastructure \
  --max-items 10
```

### 2. Get ALB DNS Name
```bash
aws cloudformation describe-stacks \
  --stack-name brewcraft-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text
```

### 3. Test ALB Directly
```bash
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name brewcraft-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text)

curl http://$ALB_DNS
```

### 4. Test Domain
```bash
curl http://brewcraft.rocks
# Or visit in browser: http://brewcraft.rocks
```

### 5. Check EC2 Instances
```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=dev-brewcraft-instance" \
  --query 'Reservations[].Instances[].[InstanceId,State.Name,PublicIpAddress]' \
  --output table
```

### 6. Check Target Health
```bash
TG_ARN=$(aws elbv2 describe-target-groups \
  --names dev-brewcraft-tg \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

aws elbv2 describe-target-health \
  --target-group-arn $TG_ARN
```

## Troubleshooting

### EC2 Instances Not Healthy
1. SSH into instance:
```bash
ssh -i brewcraft-keypair.pem ec2-user@<INSTANCE-PUBLIC-IP>
```

2. Check application status:
```bash
sudo systemctl status brewcraft
sudo journalctl -u brewcraft -f
```

3. Check logs:
```bash
cd /opt/brewcraft
cat /var/log/cloud-init-output.log
```

### Domain Not Resolving
1. Check Route53 record:
```bash
aws route53 list-resource-record-sets \
  --hosted-zone-id <YOUR-ZONE-ID> \
  --query "ResourceRecordSets[?Name=='brewcraft.rocks.']"
```

2. Test DNS resolution:
```bash
nslookup brewcraft.rocks
dig brewcraft.rocks
```

3. Wait for DNS propagation (up to 10 minutes)

### ALB Returns 503
- Wait for EC2 instances to finish bootstrapping (5-7 minutes)
- Check target group health (see step 6 above)
- Verify security group rules allow ALB → EC2 on port 3000

## Update Stack

To update existing stack:
```bash
aws cloudformation update-stack \
  --stack-name brewcraft-infrastructure \
  --template-body file://main-infrastructure.yaml \
  --parameters file://parameters.yaml \
  --capabilities CAPABILITY_IAM
```

## Delete Stack

To remove all resources:
```bash
aws cloudformation delete-stack --stack-name brewcraft-infrastructure

# Monitor deletion
aws cloudformation wait stack-delete-complete \
  --stack-name brewcraft-infrastructure
```

## Cost Estimation (us-east-1)

### Running Costs (per month):
- EC2 t2.micro × 2 instances: ~$16.00
- Application Load Balancer: ~$22.00
- Data Transfer: ~$5.00
- DynamoDB (PAY_PER_REQUEST): ~$2-5
- Route53 Hosted Zone: $0.50

**Total: ~$45-50/month**

### AWS Learner Lab Notes:
- Lab sessions have $100 credit
- Sessions expire after 4 hours of inactivity
- Stop instances when not in use to conserve credits
- Use `aws ec2 stop-instances` to stop without deleting

## Infrastructure Components

### Created Resources:
1. **VPC** (10.0.0.0/16)
   - 2 Public Subnets across 2 AZs
   - Internet Gateway
   - Route Tables

2. **Security Groups**
   - ALB: Ports 80, 443 from internet
   - EC2: Port 3000 from ALB, Port 22 from internet

3. **Application Load Balancer**
   - Internet-facing
   - HTTP listener on port 80
   - Target group pointing to EC2 port 3000

4. **Auto Scaling Group**
   - 2-4 EC2 t2.micro instances
   - CPU-based scaling (scale up >70%, down <30%)
   - Health checks via ALB

5. **Route53 Failover**
   - Primary: A record pointing to ALB (with health check)
   - Secondary: A record pointing to S3 static website
   - Health check monitors ALB for "BrewCraft" string

6. **S3 Failover Bucket**
   - Static website hosting enabled
   - Maintenance/error pages
   - Public read access via bucket policy

7. **DynamoDB Tables** (7 tables)
   - Visitors, Content, Sessions
   - Menu, Bookings, Tables, Orders

## Next Steps

1. Replace placeholder application with actual React build
2. Upload failover pages to S3 bucket (see failover-page/upload-to-s3.sh)
3. Set up CI/CD pipeline for automated deployments
4. Configure HTTPS with ACM certificate
5. Set up CloudWatch dashboards for monitoring
6. Configure backup policies for DynamoDB
7. Implement Lambda functions for backend API

## Testing Failover

To test the Route53 failover mechanism:

### 1. Check Current Status
```bash
# Check health check status
aws route53 get-health-check-status \
  --health-check-id <HEALTH-CHECK-ID>

# Get health check ID from stack
aws cloudformation describe-stack-resources \
  --stack-name brewcraft-infrastructure \
  --logical-resource-id ALBHealthCheck \
  --query 'StackResources[0].PhysicalResourceId'
```

### 2. Simulate Failure (Test Environment Only)
```bash
# Stop all EC2 instances to trigger failover
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name dev-brewcraft-asg \
  --desired-capacity 0

# Wait 2-3 minutes for health check to fail
# Visit http://brewcraft.rocks - should show failover page
```

### 3. Restore Service
```bash
# Restore instances
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name dev-brewcraft-asg \
  --desired-capacity 2

# Health check will pass and traffic returns to ALB
```

### 4. Monitor Failover Events
```bash
# Check Route53 query logs (if configured)
aws route53 list-query-logging-configs

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Route53 \
  --metric-name HealthCheckStatus \
  --dimensions Name=HealthCheckId,Value=<HEALTH-CHECK-ID> \
  --start-time 2026-01-07T00:00:00Z \
  --end-time 2026-01-07T23:59:59Z \
  --period 300 \
  --statistics Average
```
