#!/bin/bash
# Bootstrap script for EC2 to use DynamoDB

yum update -y
yum install -y httpd php php-cli

# Install Composer and AWS SDK
cd /var/www/html
curl -sS https://getcomposer.org/installer | php
php composer.phar require aws/aws-sdk-php

# Get table names from SSM Parameter Store
export AWS_REGION="us-east-1"
VISITORS_TABLE=$(aws ssm get-parameter --name "/website/dev/dynamodb/visitors-table" --region $AWS_REGION --query 'Parameter.Value' --output text)
CONTENT_TABLE=$(aws ssm get-parameter --name "/website/dev/dynamodb/content-table" --region $AWS_REGION --query 'Parameter.Value' --output text)
SESSIONS_TABLE=$(aws ssm get-parameter --name "/website/dev/dynamodb/sessions-table" --region $AWS_REGION --query 'Parameter.Value' --output text)

# Create environment file
cat > /var/www/html/.env <<EOF
VISITORS_TABLE=$VISITORS_TABLE
CONTENT_TABLE=$CONTENT_TABLE
SESSIONS_TABLE=$SESSIONS_TABLE
AWS_REGION=$AWS_REGION
EOF

systemctl start httpd
systemctl enable httpd