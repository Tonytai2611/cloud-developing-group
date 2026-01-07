# AWS Learner Lab Deployment Guide

## Overview

AWS Academy Learner Lab has restrictions that require specific configuration. This guide provides deployment instructions compatible with Learner Lab limitations.

## Learner Lab Restrictions

Cannot create:
- Custom IAM roles
- Custom IAM policies
- IAM instance profiles
- VPCs (in some labs)

Must use:
- LabRole: `arn:aws:iam::<account-id>:role/LabRole`
- LabInstanceProfile: `arn:aws:iam::<account-id>:instance-profile/LabInstanceProfile`

Additional constraints:
- Region: us-east-1 only
- Session duration: 4 hours
- Budget: approximately $50-100

## Prerequisites

AWS CLI configured with Learner Lab credentials:

```bash
aws configure set aws_access_key_id <ACCESS_KEY>
aws configure set aws_secret_access_key <SECRET_KEY>
aws configure set aws_session_token <SESSION_TOKEN>
aws configure set region us-east-1
```

Verify credentials:

```bash
aws sts get-caller-identity
```

## Deployment Steps

### Step 1: Validate Template

```bash
cd Dynamo/cloudformation

aws cloudformation validate-template \
  --template-body file://dynamo-website-stack.yaml
```

### Step 2: Deploy CloudFormation Stack

```bash
aws cloudformation create-stack \
  --stack-name restaurant-dynamodb-dev \
  --template-body file://dynamo-website-stack.yaml \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=dev \
    ParameterKey=TableName,ParameterValue=RestaurantApp \
    ParameterKey=ReadCapacityUnits,ParameterValue=5 \
    ParameterKey=WriteCapacityUnits,ParameterValue=5 \
    ParameterKey=EnablePointInTimeRecovery,ParameterValue=false \
  --region us-east-1
```

### Step 3: Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name restaurant-dynamodb-dev \
  --query 'Stacks[0].StackStatus'

aws cloudformation wait stack-create-complete \
  --stack-name restaurant-dynamodb-dev
```

### Step 4: Verify Tables

```bash
aws dynamodb list-tables

aws dynamodb describe-table --table-name RestaurantApp-Menu-dev
```

## Using LabRole

### Get LabRole ARN

```bash
LAB_ROLE_ARN=$(aws iam get-role --role-name LabRole --query 'Role.Arn' --output text)
echo $LAB_ROLE_ARN
```

### Create Lambda Function

```bash
MENU_TABLE=$(aws ssm get-parameter --name "/website/dev/dynamodb/menu-table" --query 'Parameter.Value' --output text)

aws lambda create-function \
  --function-name getMenu \
  --runtime nodejs18.x \
  --role $LAB_ROLE_ARN \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --environment Variables="{MENU_TABLE_NAME=$MENU_TABLE,AWS_REGION=us-east-1}"
```

### Launch EC2 Instance

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --iam-instance-profile Name=LabInstanceProfile \
  --user-data file://../scripts/userdata.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=RestaurantApp-Server}]'
```

## Lambda Function Example

### getMenu.js

```javascript
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    try {
        const result = await docClient.send(new ScanCommand({
            TableName: process.env.MENU_TABLE_NAME,
            FilterExpression: "available = :true",
            ExpressionAttributeValues: { ":true": true }
        }));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ success: true, data: result.Items })
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
```

### Package Lambda

```bash
npm init -y
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
zip -r function.zip index.js node_modules/
```

## Testing

### Insert Sample Data

```bash
aws dynamodb put-item \
  --table-name RestaurantApp-Menu-dev \
  --item '{
    "menuItemId": {"S": "espresso-001"},
    "name": {"S": "Espresso"},
    "category": {"S": "Coffee"},
    "price": {"N": "3.50"},
    "description": {"S": "Rich Italian espresso"},
    "available": {"BOOL": true},
    "imageUrl": {"S": "https://example.com/espresso.jpg"}
  }'
```

### Query Data

```bash
aws dynamodb scan \
  --table-name RestaurantApp-Menu-dev \
  --filter-expression "category = :cat" \
  --expression-attribute-values '{":cat": {"S": "Coffee"}}' \
  --max-items 10
```

### Test Lambda Function

```bash
aws lambda invoke \
  --function-name getMenu \
  --payload '{}' \
  response.json

cat response.json
```

## Cost Management

### Monitor Usage

```bash
aws dynamodb describe-table \
  --table-name RestaurantApp-Menu-dev \
  --query 'Table.[TableSizeBytes,ItemCount]'
```

### Cost Optimization

- Use pay-per-request billing for low-traffic tables
- Set provisioned capacity to minimum (5 RCU/WCU)
- Enable TTL to auto-delete old data
- Delete stack when not in use

### Estimated Costs

- VisitorsTable (Provisioned 5/5): $2.50/month
- Other tables (Pay-per-request): $0.01 per read/write
- Storage: $0.25/GB/month
- Lambda: First 1M requests free
- Total for testing: < $5/month

## Troubleshooting

### Access Denied

Ensure Learner Lab session is active. Re-authenticate every 4 hours.

### Stack Creation Failed

Check CloudFormation events:

```bash
aws cloudformation describe-stack-events \
  --stack-name restaurant-dynamodb-dev \
  --max-items 10
```

### Table Not Found

Wait for stack creation to complete:

```bash
aws cloudformation wait stack-create-complete \
  --stack-name restaurant-dynamodb-dev
```

### Lambda Execution Failed

Check CloudWatch logs:

```bash
aws logs tail /aws/lambda/getMenu --follow
```

## Cleanup

Delete all resources:

```bash
aws cloudformation delete-stack --stack-name restaurant-dynamodb-dev

aws cloudformation wait stack-delete-complete --stack-name restaurant-dynamodb-dev

aws lambda delete-function --function-name getMenu

aws ec2 terminate-instances --instance-ids <instance-id>
```

## Session Management

Learner Lab sessions expire after 4 hours. Before expiration:

1. Save all work
2. Document current state
3. Export table data if needed
4. Stop running instances

Re-authenticate:

```bash
aws configure set aws_access_key_id <NEW_KEY>
aws configure set aws_secret_access_key <NEW_SECRET>
aws configure set aws_session_token <NEW_TOKEN>
```

## Additional Resources

- AWS DynamoDB Documentation: https://docs.aws.amazon.com/dynamodb/
- AWS Lambda Documentation: https://docs.aws.amazon.com/lambda/
- AWS CLI Reference: https://docs.aws.amazon.com/cli/
