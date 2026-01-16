#!/bin/bash

# Script to upload failover pages to S3 bucket
# Run this after stack creation to populate the failover bucket

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

STACK_NAME="brewcraft-infrastructure"

echo "====================================="
echo "Upload Failover Pages to S3"
echo "====================================="
echo ""

# Get bucket name from stack outputs
echo -e "${YELLOW}Getting bucket name from CloudFormation...${NC}"
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`FailoverBucketName`].OutputValue' \
    --output text)

if [ -z "$BUCKET_NAME" ]; then
    echo "Error: Could not retrieve bucket name from stack"
    exit 1
fi

echo -e "${GREEN}Bucket: $BUCKET_NAME${NC}"
echo ""

# Upload files
echo -e "${YELLOW}Uploading index.html...${NC}"
aws s3 cp index.html s3://$BUCKET_NAME/index.html \
    --content-type "text/html" \
    --cache-control "max-age=300"

echo -e "${YELLOW}Uploading error.html...${NC}"
aws s3 cp error.html s3://$BUCKET_NAME/error.html \
    --content-type "text/html" \
    --cache-control "max-age=300"

echo ""
echo -e "${GREEN}Upload completed successfully!${NC}"
echo ""

# Get website URL
WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`FailoverBucketWebsiteURL`].OutputValue' \
    --output text)

echo "====================================="
echo "Failover Website Details:"
echo "====================================="
echo "Bucket: $BUCKET_NAME"
echo "Website URL: $WEBSITE_URL"
echo ""
echo "Test failover page:"
echo "curl $WEBSITE_URL"
echo ""
