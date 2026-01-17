#!/bin/bash

# Script to update Lambda function environment variables with DynamoDB table names
# Run this after CloudFormation stack is created

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

STACK_NAME="brewcraft-infrastructure"

echo "================================================="
echo "Update Lambda Environment Variables"
echo "================================================="
echo ""

# Get table names from CloudFormation outputs
echo -e "${YELLOW}Fetching DynamoDB table names from CloudFormation...${NC}"

MENU_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`MenuTableName`].OutputValue' \
    --output text)

BOOKINGS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`BookingsTableName`].OutputValue' \
    --output text)

VISITORS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`VisitorsTableName`].OutputValue' \
    --output text)

echo -e "${GREEN}Menu Table: $MENU_TABLE${NC}"
echo -e "${GREEN}Bookings Table: $BOOKINGS_TABLE${NC}"
echo -e "${GREEN}Visitors Table: $VISITORS_TABLE${NC}"
echo ""

# List of Lambda functions to update
LAMBDA_FUNCTIONS=(
    "lambda_menu_handler"
    "booking_handler"
    "table_handler"
    "contact_handler"
    "chat_handler"
    "upload_image_handler"
)

echo -e "${YELLOW}Updating Lambda function environment variables...${NC}"
echo ""

# Update lambda_menu_handler
echo "Updating lambda_menu_handler..."
aws lambda update-function-configuration \
    --function-name lambda_menu_handler \
    --environment "Variables={MENU_TABLES=$MENU_TABLE,AWS_REGION=us-east-1}" \
    --no-cli-pager > /dev/null 2>&1 || echo "  - lambda_menu_handler not found or update failed"

# Update booking_handler
echo "Updating booking_handler..."
aws lambda update-function-configuration \
    --function-name booking_handler \
    --environment "Variables={BOOKING_FOODS_TABLE=$BOOKINGS_TABLE,TABLES_TABLE=RestaurantApp-Tables-dev,ADMIN_TOPIC_ARN=arn:aws:sns:us-east-1:533266957010:AdminBookingAlerts,CUSTOMER_TOPIC_ARN=arn:aws:sns:us-east-1:533266957010:CustomerNotifications,AWS_REGION=us-east-1}" \
    --no-cli-pager > /dev/null 2>&1 || echo "  - booking_handler not found or update failed"

# Update table_handler
echo "Updating table_handler..."
aws lambda update-function-configuration \
    --function-name table_handler \
    --environment "Variables={TABLES_TABLE=RestaurantApp-Tables-dev,AWS_REGION=us-east-1}" \
    --no-cli-pager > /dev/null 2>&1 || echo "  - table_handler not found or update failed"

# Update contact_handler
echo "Updating contact_handler..."
aws lambda update-function-configuration \
    --function-name contact_handler \
    --environment "Variables={STATE_MACHINE_ARN=arn:aws:states:us-east-1:533266957010:stateMachine:ContactProcessStateMachine,AWS_REGION=us-east-1}" \
    --no-cli-pager > /dev/null 2>&1 || echo "  - contact_handler not found or update failed"

echo ""
echo -e "${GREEN}Lambda environment variables updated!${NC}"
echo ""

echo "================================================="
echo "Environment Variables Summary"
echo "================================================="
echo ""
echo "Menu Handler:"
echo "  MENU_TABLES=$MENU_TABLE"
echo ""
echo "Booking Handler:"
echo "  BOOKING_FOODS_TABLE=$BOOKINGS_TABLE"
echo "  TABLES_TABLE=RestaurantApp-Tables-dev"
echo ""
echo "Other Tables (from stack):"
echo "  Orders: RestaurantApp-Orders-dev"
echo "  Content: RestaurantApp-Content-dev"
echo "  Sessions: RestaurantApp-Sessions-dev"
echo "  Visitors: $VISITORS_TABLE"
echo ""

echo -e "${YELLOW}Note: Update your Express server .env file with these values${NC}"
echo ""
