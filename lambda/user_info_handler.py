import json
import boto3
import os
from decimal import Decimal

cognito = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb')

USERS_TABLE = os.environ.get('USERS_TABLE', 'USERS_TABLE')

def decimal_to_native(obj):
    """Convert Decimal to native Python types"""
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj

def lambda_handler(event, context):
    """
    Get current user info from Cognito and DynamoDB
    GET /api/me
    Headers: { "Authorization": "Bearer <access_token>" }
    """
    
    # CORS headers
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
    }
    
    # Handle OPTIONS request for CORS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Get access token from Authorization header
        auth_header = event.get('headers', {}).get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Missing or invalid authorization header'})
            }
        
        access_token = auth_header.replace('Bearer ', '')
        
        # Get user info from Cognito
        user_info = cognito.get_user(AccessToken=access_token)
        
        # Extract username and attributes
        username = user_info['Username']
        attributes = {}
        for attr in user_info['UserAttributes']:
            attributes[attr['Name']] = attr['Value']
        
        # Check if admin
        is_admin = attributes.get('custom:role') == 'admin'
        
        # Get additional user data from DynamoDB
        table = dynamodb.Table(USERS_TABLE)
        try:
            db_response = table.get_item(Key={'username': username})
            db_user = decimal_to_native(db_response.get('Item', {}))
        except Exception as db_error:
            print(f"DynamoDB error: {str(db_error)}")
            db_user = {}
        
        # Merge user data
        user_data = {
            'username': username,
            'email': attributes.get('email', ''),
            'name': attributes.get('name', ''),
            'role': attributes.get('custom:role', 'customer'),
            'isAdmin': is_admin,
            **db_user
        }
        
        print(f"✅ User info retrieved for {username}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'userInfo': user_data})
        }
        
    except cognito.exceptions.NotAuthorizedException:
        print(f"❌ Invalid or expired token")
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid or expired token'})
        }
    
    except Exception as e:
        print(f"❌ Get user info error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Failed to get user info',
                'message': str(e)
            })
        }
