# BrewCraft Infrastructure Quick Start

## Files Created

1. **main-infrastructure.yaml** - Complete CloudFormation template
   - VPC with 2 public subnets
   - Application Load Balancer
   - Auto Scaling Group (2-4 EC2 instances)
   - Route53 DNS record
   - 7 DynamoDB tables
   - CloudWatch alarms

2. **parameters.yaml** - Stack parameters (EDIT THIS FIRST)

3. **deploy.sh** - Automated deployment script

4. **INFRASTRUCTURE-DEPLOYMENT.md** - Detailed deployment guide

## Before Deployment

### 1. Get Your Route53 Hosted Zone ID
```bash
aws route53 list-hosted-zones --query "HostedZones[?Name=='brewcraft.rocks.'].Id" --output text
```

### 2. Create EC2 Key Pair
```bash
aws ec2 create-key-pair --key-name brewcraft-keypair --query 'KeyMaterial' --output text > brewcraft-keypair.pem
```

### 3. Edit parameters.yaml
Replace these values:
- `HostedZoneId`: Your actual Route53 Hosted Zone ID
- `KeyPairName`: Your EC2 key pair name

## Deploy

### Quick Deploy
```bash
cd Dynamo/cloudformation
chmod +x deploy.sh
./deploy.sh
```

### Manual Deploy
```bash
cd Dynamo/cloudformation

aws cloudformation create-stack \
  --stack-name brewcraft-infrastructure \
  --template-body file://main-infrastructure.yaml \
  --parameters file://parameters.yaml \
  --capabilities CAPABILITY_IAM
```

## What Gets Created

- **VPC**: 10.0.0.0/16 with 2 public subnets
- **ALB**: Internet-facing load balancer
- **EC2**: 2-4 t2.micro instances with auto-scaling
- **Route53**: brewcraft.rocks → ALB (with failover to S3)
- **S3 Bucket**: Failover static website for maintenance/errors
- **Health Check**: Monitors ALB and triggers failover if needed
- **DynamoDB**: 7 tables for application data
- **Cost**: ~$45-50/month

## Timeline

- Deployment: 15-25 minutes
- DNS propagation: 5-10 minutes
- Total: 20-35 minutes

## Verify

Test ALB directly:
```bash
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name brewcraft-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
  --output text)

curl http://$ALB_DNS
```

Test domain:
```bash
curl http://brewcraft.rocks
```

## Next Steps

1. Visit http://brewcraft.rocks in your browser
2. Upload failover pages: `cd failover-page && ./upload-to-s3.sh`
3. SSH into EC2 instance to deploy actual React application
4. Set up HTTPS with ACM certificate
5. Configure CI/CD pipeline

## Cleanup

```bash
aws cloudformation delete-stack --stack-name brewcraft-infrastructure
```

## Support

See [INFRASTRUCTURE-DEPLOYMENT.md](../docs/INFRASTRUCTURE-DEPLOYMENT.md) for:
- Troubleshooting guide
- Detailed verification steps
- Cost breakdown
- Architecture details
