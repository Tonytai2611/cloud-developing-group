# Dynamo - AWS Infrastructure

AWS infrastructure for BrewCraft restaurant application. Contains DynamoDB tables, CloudFormation templates, and deployment scripts.

## Folder Structure

```
Dynamo/
├── cloudformation/          CloudFormation templates
│   └── dynamo-website-stack.yaml
├── scripts/                 Deployment scripts
│   └── userdata.sh
├── docs/                    Documentation
│   └── DEPLOYMENT-GUIDE.md
├── legacy/                  Archived PHP code
│   ├── dynamodb-config.php
│   └── TestDB.php
└── README.md
```

## AWS Learner Lab Restrictions

This stack is compatible with AWS Academy Learner Lab:

- Cannot create custom IAM roles or policies
- Must use LabRole for Lambda and EC2 instances
- Must use LabInstanceProfile for EC2 instance profiles
- Sessions expire after 4 hours
- Region restricted to us-east-1
- Budget limit approximately $50-100

Get LabRole ARN:
```bash
aws iam get-role --role-name LabRole --query 'Role.Arn' --output text
```

## Quick Start

### Deploy DynamoDB Stack

```bash
cd Dynamo/cloudformation

# Deploy the stack
aws cloudformation create-stack \
  --stack-name restaurant-dynamodb-dev \
  --template-body file://dynamo-website-stack.yaml \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=dev \
    ParameterKey=TableName,ParameterValue=RestaurantApp \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name restaurant-dynamodb-dev

# View outputs
aws cloudformation describe-stacks \
  --stack-name restaurant-dynamodb-dev \
  --query 'Stacks[0].Outputs'
```

### Launch EC2 Instance

```bash
# Use the userdata script when launching an EC2 instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --user-data file://scripts/userdata.sh \
  --iam-instance-profile Name=LabInstanceProfile
```

## DynamoDB Tables

The CloudFormation stack creates 7 tables:

| Table | Purpose | Billing Mode |
|-------|---------|--------------|
| **Menu** | Restaurant menu items | Pay-per-request |
| **Bookings** | Table reservations | Pay-per-request |
| **Tables** | Restaurant table config | Pay-per-request |
| **Orders** | Food orders | Pay-per-request |
| **Sessions** | User sessions | Pay-per-request |
| **Content** | CMS content | Pay-per-request |
| **Visitors** | Analytics | Provisioned (5 RCU/WCU) |

## Documentation

- **[DEPLOYMENT-GUIDE.md](docs/DEPLOYMENT-GUIDE.md)** - Complete deployment instructions
- **[CloudFormation Template](cloudformation/dynamo-website-stack.yaml)** - Infrastructure definition
- **[Userdata Script](scripts/userdata.sh)** - EC2 bootstrap script

## Common Operations

### Check Stack Status
```bash
aws cloudformation describe-stacks \
  --stack-name restaurant-dynamodb-dev \
  --query 'Stacks[0].StackStatus'
```

### List Tables
```bash
aws dynamodb list-tables
```

### Get Table from SSM Parameter Store
```bash
aws ssm get-parameter \
  --name "/website/dev/dynamodb/menu-table" \
  --query 'Parameter.Value' \
  --output text
```

### Insert Sample Data
```bash
aws dynamodb put-item \
  --table-name RestaurantApp-Menu-dev \
  --item '{
    "menuItemId": {"S": "item-001"},
    "name": {"S": "Espresso"},
    "category": {"S": "Coffee"},
    "price": {"N": "3.50"},
    "available": {"BOOL": true}
  }'
```

## Lambda Functions with LabRole

Create Lambda functions using pre-existing LabRole:

```bash
LAB_ROLE_ARN=$(aws iam get-role --role-name LabRole --query 'Role.Arn' --output text)
MENU_TABLE=$(aws ssm get-parameter --name "/website/dev/dynamodb/menu-table" --query 'Parameter.Value' --output text)

aws lambda create-function \
  --function-name getMenu \
  --runtime nodejs18.x \
  --role $LAB_ROLE_ARN \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --environment Variables="{MENU_TABLE_NAME=$MENU_TABLE,AWS_REGION=us-east-1}"
```

## EC2 with LabInstanceProfile

Launch EC2 instances using pre-existing LabInstanceProfile:

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --iam-instance-profile Name=LabInstanceProfile \
  --user-data file://scripts/userdata.sh
```

## Legacy PHP Code

Files in `legacy/` are from an older PHP-based implementation. Replaced by Node.js SDK and React frontend. Kept for reference only.

## Cleanup

### Recent Changes (January 2026)
- Reorganized into focused subdirectories
- Moved CloudFormation templates to dedicated folder
- Separated scripts from templates
- Archived legacy PHP code
- Created comprehensive documentation structure
## Cleanup

Delete all infrastructure:

```bash
aws cloudformation delete-stack --stack-name restaurant-dynamodb-dev
aws cloudformation wait stack-delete-complete --stack-name restaurant-dynamodb-dev
```

## Dependencies

- AWS CLI v2
- AWS Learner Lab account
- Node.js 18+ for Lambda functions
- Bash for running scripts
- Bash (for running scripts)

## Cleanup

To delete all infrastructure:

```bash
# Delete CloudFormation stack (removes all tables)
aws cloudformation delete-stack --stack-name restaurant-dynamodb-dev

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name restaurant-dynamodb-dev
```

## Additional Resources

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

---

