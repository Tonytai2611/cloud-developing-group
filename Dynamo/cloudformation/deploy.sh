#!/bin/bash

# BrewCraft Infrastructure Deployment Script
# This script deploys the complete infrastructure stack to AWS

set -e

STACK_NAME="brewcraft-infrastructure"
TEMPLATE_FILE="main-infrastructure.yaml"
PARAMETERS_FILE="parameters.yaml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "====================================="
echo "BrewCraft Infrastructure Deployment"
echo "====================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    echo "Install from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo -e "${RED}Error: Template file not found: $TEMPLATE_FILE${NC}"
    exit 1
fi

# Check if parameters file exists
if [ ! -f "$PARAMETERS_FILE" ]; then
    echo -e "${RED}Error: Parameters file not found: $PARAMETERS_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Validating template...${NC}"
if aws cloudformation validate-template --template-body file://$TEMPLATE_FILE > /dev/null; then
    echo -e "${GREEN}Template is valid${NC}"
else
    echo -e "${RED}Template validation failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Checking if stack exists...${NC}"
if aws cloudformation describe-stacks --stack-name $STACK_NAME &> /dev/null; then
    echo -e "${YELLOW}Stack exists. Updating...${NC}"
    ACTION="update"
    aws cloudformation update-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters file://$PARAMETERS_FILE \
        --capabilities CAPABILITY_IAM
    
    echo ""
    echo -e "${YELLOW}Waiting for stack update to complete...${NC}"
    aws cloudformation wait stack-update-complete --stack-name $STACK_NAME
else
    echo -e "${YELLOW}Stack does not exist. Creating...${NC}"
    ACTION="create"
    aws cloudformation create-stack \
        --stack-name $STACK_NAME \
        --template-body file://$TEMPLATE_FILE \
        --parameters file://$PARAMETERS_FILE \
        --capabilities CAPABILITY_IAM
    
    echo ""
    echo -e "${YELLOW}Waiting for stack creation to complete (this may take 15-25 minutes)...${NC}"
    aws cloudformation wait stack-create-complete --stack-name $STACK_NAME
fi

echo ""
echo -e "${GREEN}Stack $ACTION completed successfully!${NC}"
echo ""

echo "====================================="
echo "Stack Outputs:"
echo "====================================="
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "====================================="
echo "Deployment Summary:"
echo "====================================="

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text)

ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`ALBDNSName`].OutputValue' \
    --output text)

echo -e "${GREEN}Website URL: $WEBSITE_URL${NC}"
echo -e "${GREEN}ALB DNS: $ALB_DNS${NC}"
echo ""
echo "Note: DNS propagation may take 5-10 minutes"
echo "Test ALB directly first: curl http://$ALB_DNS"
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "====================================="
echo "Next Steps:"
echo "====================================="
echo ""
echo "1. Upload failover pages to S3:"
echo "   cd failover-page && ./upload-to-s3.sh"
echo ""
echo "2. Update Lambda function environment variables:"
echo "   cd ../../lambda && chmod +x update-lambda-env.sh && ./update-lambda-env.sh"
echo ""
echo "3. Visit your website:"
echo "   http://brewcraft.rocks"
echo ""
