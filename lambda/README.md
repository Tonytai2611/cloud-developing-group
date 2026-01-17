# Lambda Functions Inventory

## Deployed Lambda Functions

Based on the existing codebase, the following Lambda functions are already deployed:

### 1. **lambda_menu_handler** (Menu API)
- **Table**: MENU_TABLES
- **Operations**: GET, POST, PUT, DELETE
- **Endpoints**:
  - GET `/menu` - Get all menu items
  - POST `/menu` - Create menu item
  - PUT `/menu/{itemId}` - Update menu item
  - DELETE `/menu/{itemId}` - Delete menu item
- **Features**: CORS enabled, Decimal handling

### 2. **booking_handler** (Booking Management)
- **Tables**: BOOKING_FOODS_TABLE, TABLES_TABLE
- **SNS Topics**: 
  - AdminBookingAlerts (arn:aws:sns:us-east-1:533266957010:AdminBookingAlerts)
  - CustomerNotifications (arn:aws:sns:us-east-1:533266957010:CustomerNotifications)
- **Operations**: GET, POST, PUT, DELETE
- **Endpoints**:
  - GET `/bookings` - List bookings
  - POST `/bookings` - Create booking
  - PUT `/bookings/{bookingId}` - Update booking
  - DELETE `/bookings/{bookingId}` - Cancel booking
- **Features**: SNS notifications, table availability check

### 3. **contact_handler** (Contact Form)
- **Step Function**: ContactProcessStateMachine
  - ARN: arn:aws:states:us-east-1:533266957010:stateMachine:ContactProcessStateMachine
- **Operations**: POST
- **Endpoints**:
  - POST `/contact` - Submit contact form
- **Features**: Step Functions integration, validation

### 4. **validate_contact_input** (Input Validation)
- **Purpose**: Validates contact form inputs
- **Used by**: ContactProcessStateMachine

### 5. **table_handler** (Table Management)
- **Table**: TABLES_TABLE
- **Operations**: GET, POST, PUT, DELETE
- **Endpoints**:
  - GET `/tables` - List tables
  - POST `/tables` - Create table
  - PUT `/tables/{tableId}` - Update table
  - DELETE `/tables/{tableId}` - Delete table

### 6. **chat_handler** (Admin Chat)
- **Purpose**: Real-time chat support
- **Operations**: WebSocket or API Gateway integration

### 7. **upload_image_handler** / **lambda_image_upload** (Image Upload)
- **Purpose**: Handle image uploads to S3
- **Features**: Presigned URLs, image processing

## Integration with Infrastructure

### Current Setup (Express Server)
The Express server ([server/index.js](../server/index.js)) currently invokes Lambda functions directly:

```javascript
const lambda = new AWS.Lambda();
const result = await lambda.invoke({
  FunctionName: 'ContactHandler',
  InvocationType: 'RequestResponse',
  Payload: JSON.stringify(payload)
});
```

### Recommended Architecture

#### Option 1: API Gateway + Lambda (Serverless)
- Create API Gateway REST API
- Connect Lambda functions as integrations
- Frontend calls API Gateway directly
- Remove Express server Lambda invocations

#### Option 2: Hybrid (Current CloudFormation)
- Keep Express server on EC2 for authentication/routing
- Express server invokes Lambda functions for specific operations
- Lambda functions handle DynamoDB operations
- Keep current architecture

## API Gateway Setup (Optional Enhancement)

If you want to expose Lambda functions via API Gateway:

### REST API Structure
```
/api/v1
  /menu
    GET    - List menu items
    POST   - Create menu item
    /{id}
      GET    - Get menu item
      PUT    - Update menu item
      DELETE - Delete menu item
  
  /bookings
    GET    - List bookings
    POST   - Create booking
    /{id}
      GET    - Get booking
      PUT    - Update booking
      DELETE - Cancel booking
  
  /tables
    GET    - List tables
    POST   - Create table
    /{id}
      PUT    - Update table
      DELETE - Delete table
  
  /contact
    POST   - Submit contact form
  
  /upload
    POST   - Upload image
```

## Environment Configuration

### Lambda Environment Variables Needed:
```bash
MENU_TABLES=RestaurantApp-Menu-dev
BOOKING_FOODS_TABLE=RestaurantApp-Bookings-dev
TABLES_TABLE=RestaurantApp-Tables-dev
ADMIN_TOPIC_ARN=arn:aws:sns:us-east-1:533266957010:AdminBookingAlerts
CUSTOMER_TOPIC_ARN=arn:aws:sns:us-east-1:533266957010:CustomerNotifications
```

### Express Server Environment Variables:
```bash
AWS_REGION=us-east-1
COGNITO_CLIENT_ID=<your-client-id>
COGNITO_CLIENT_SECRET=<your-client-secret>
USERS_TABLE=RestaurantApp-Sessions-dev
```

## Testing Lambda Functions

### Test Menu Handler
```bash
aws lambda invoke \
  --function-name lambda_menu_handler \
  --payload '{"httpMethod":"GET"}' \
  --cli-binary-format raw-in-base64-out \
  response.json
cat response.json
```

### Test Booking Handler
```bash
aws lambda invoke \
  --function-name booking_handler \
  --payload '{"httpMethod":"GET"}' \
  --cli-binary-format raw-in-base64-out \
  response.json
cat response.json
```

### Test Contact Handler
```bash
aws lambda invoke \
  --function-name contact_handler \
  --payload '{"body":"{\"name\":\"Test\",\"email\":\"test@example.com\",\"message\":\"Test message\"}"}' \
  --cli-binary-format raw-in-base64-out \
  response.json
cat response.json
```

## Lambda Function Permissions

All Lambda functions should have:
- DynamoDB read/write access to relevant tables
- SNS publish access (booking_handler)
- Step Functions start execution (contact_handler)
- CloudWatch Logs write access

Since you're using AWS Learner Lab, attach **LabRole** to Lambda functions.

## Next Steps

1. ✅ Lambda functions already deployed
2. ⏳ Update Lambda environment variables with new DynamoDB table names
3. ⏳ Configure Express server to invoke Lambda functions
4. ⏳ (Optional) Add API Gateway for direct frontend access
5. ⏳ Update Lambda IAM permissions if needed
