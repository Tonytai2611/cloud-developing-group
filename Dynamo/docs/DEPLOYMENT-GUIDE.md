# DynamoDB CloudFormation Deployment Guide

## Overview
This CloudFormation stack creates a complete DynamoDB infrastructure for your restaurant web application with the following tables:

### Tables Created:
1. **VisitorsTable** - Tracks website visitors and analytics
2. **ContentTable** - Stores website content and pages  
3. **SessionsTable** - Manages user sessions
4. **MenuTable** - Restaurant menu items management
5. **BookingsTable** - Table reservations
6. **TablesTable** - Restaurant table configuration
7. **OrdersTable** - Food orders management

## Prerequisites

1. AWS CLI installed and configured
2. AWS account with appropriate permissions
3. Valid AWS credentials configured

## Deployment Steps

### Option 1: Deploy via AWS CLI

```bash
# Validate the template
aws cloudformation validate-template \
  --template-body file://dynamo-website-stack.yaml

# Create the stack
aws cloudformation create-stack \
  --stack-name restaurant-dynamodb-stack \
  --template-body file://dynamo-website-stack.yaml \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=dev \
    ParameterKey=TableName,ParameterValue=RestaurantApp \
    ParameterKey=ReadCapacityUnits,ParameterValue=5 \
    ParameterKey=WriteCapacityUnits,ParameterValue=5 \
    ParameterKey=EnablePointInTimeRecovery,ParameterValue=false \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Monitor the deployment
aws cloudformation describe-stacks \
  --stack-name restaurant-dynamodb-stack \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name restaurant-dynamodb-stack \
  --region us-east-1
```

### Option 2: Deploy via AWS Console

1. Go to AWS CloudFormation console
2. Click "Create Stack" > "With new resources"
3. Upload `dynamo-website-stack.yaml`
4. Configure parameters:
   - **EnvironmentName**: `dev` (or `staging`/`prod`)
   - **TableName**: `RestaurantApp`
   - **ReadCapacityUnits**: `5`
   - **WriteCapacityUnits**: `5`
   - **EnablePointInTimeRecovery**: `false`
5. Check "I acknowledge that AWS CloudFormation might create IAM resources"
6. Click "Create Stack"

## Stack Outputs

After deployment, the stack provides these outputs:

- Table names and ARNs for all 7 tables
- IAM Role ARN for DynamoDB access
- Instance Profile name for EC2 instances
- AWS Region

## Table Schemas

### MenuTable
```
Primary Key: menuItemId (String)
Attributes: category, name, description, price, imageUrl, available
GSI: CategoryIndex (category + name)
```

### BookingsTable
```
Primary Key: bookingId (String)
Attributes: userId, bookingDate, bookingTime, tableNumber, guests, status
GSI: UserBookingsIndex (userId + bookingDate)
GSI: DateTableIndex (bookingDate + tableNumber)
```

### TablesTable
```
Primary Key: tableId (String)
Attributes: tableNumber, capacity, location, available
GSI: CapacityIndex (capacity)
```

### OrdersTable
```
Primary Key: orderId (String)
Attributes: userId, orderDate, items, totalAmount, status
GSI: UserOrdersIndex (userId + orderDate)
GSI: StatusIndex (status + orderDate)
```

## Configuration

### SSM Parameters Created
All table names are automatically stored in SSM Parameter Store:
- `/website/dev/dynamodb/visitors-table`
- `/website/dev/dynamodb/content-table`
- `/website/dev/dynamodb/sessions-table`
- `/website/dev/dynamodb/menu-table`
- `/website/dev/dynamodb/bookings-table`
- `/website/dev/dynamodb/tables-table`
- `/website/dev/dynamodb/orders-table`
- `/website/dev/dynamodb/region`

### Retrieve Table Names
```bash
aws ssm get-parameter --name "/website/dev/dynamodb/menu-table" --query 'Parameter.Value' --output text
```

## IAM Permissions

The stack creates an IAM role with permissions for:
- GetItem, PutItem, UpdateItem, DeleteItem
- Query, Scan
- BatchGetItem, BatchWriteItem
- DescribeTable

Attach this role to:
- EC2 instances running your application
- Lambda functions
- ECS tasks

## Features

✅ **Encryption**: SSE enabled on all tables  
✅ **Auto-scaling**: Configured for VisitorsTable (provisioned mode)  
✅ **TTL**: Enabled on VisitorsTable and SessionsTable  
✅ **GSI**: Multiple indexes for efficient querying  
✅ **Pay-per-request**: Menu, Bookings, Tables, Orders use on-demand billing  
✅ **Backups**: Point-in-time recovery available (parameter configurable)

## Update Stack

```bash
aws cloudformation update-stack \
  --stack-name restaurant-dynamodb-stack \
  --template-body file://dynamo-website-stack.yaml \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=dev \
    ParameterKey=EnablePointInTimeRecovery,ParameterValue=true \
  --capabilities CAPABILITY_NAMED_IAM
```

## Delete Stack

**Warning**: This will delete all tables and data!

```bash
aws cloudformation delete-stack --stack-name restaurant-dynamodb-stack
```

## Cost Estimation

- **VisitorsTable**: Provisioned (5 RCU/WCU) ~ $2.50/month
- **Other Tables**: Pay-per-request ~ Varies based on usage
- **Storage**: $0.25/GB/month
- **Auto-scaling**: Additional cost when triggered

## Troubleshooting

### Stack Creation Failed
```bash
# View stack events
aws cloudformation describe-stack-events \
  --stack-name restaurant-dynamodb-stack \
  --max-items 10
```

### Check Table Status
```bash
aws dynamodb describe-table --table-name RestaurantApp-Menu-dev
```

### Test Table Access
```bash
aws dynamodb scan --table-name RestaurantApp-Menu-dev --max-items 5
```

## Next Steps

1. Update your application code to use the table names from SSM Parameter Store
2. Use the IAM role ARN for EC2 instance profiles or Lambda execution roles
3. Implement application logic for CRUD operations
4. Set up CloudWatch alarms for capacity monitoring
5. Configure backup retention policies

## Support

For issues or questions:
- Check CloudFormation events in AWS Console
- Review CloudWatch logs
- Verify IAM permissions
