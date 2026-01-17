import os
import json
import boto3
import hmac
import hashlib
import base64
from datetime import datetime

cognito = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb')

CLIENT_ID = os.environ['COGNITO_CLIENT_ID']
CLIENT_SECRET = os.environ['COGNITO_CLIENT_SECRET']
USERS_TABLE = os.environ.get('USERS_TABLE', 'USERS_TABLE')

def generate_secret_hash(username, client_id, client_secret):
    """Generate SECRET_HASH for Cognito"""
    message = username + client_id
    dig = hmac.new(
        client_secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()

def lambda_handler(event, context):
    """
    Unified handler for email verification operations
    
    POST /api/confirm - Confirm email with code and save user to DB
    POST /api/verify-email - Resend verification code
    
    Route detection based on event path
    """
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    # Determine which operation based on path
    path = event.get('path', '') or event.get('rawPath', '')
    
    try:
        body = json.loads(event.get('body', '{}'))
        username = body.get('username')
        
        if not username:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Username is required'})
            }
        
        # Route 1: /api/confirm - Confirm email with code
        if '/confirm' in path or body.get('code'):
            return handle_confirm(body, headers)
        
        # Route 2: /api/verify-email - Resend verification code
        else:
            return handle_resend(username, headers)
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def handle_confirm(body, headers):
    """Handle email confirmation with code"""
    username = body.get('username')
    code = body.get('code')
    email = body.get('email', '')
    name = body.get('name', '')
    role = body.get('role', 'customer')
    
    if not code:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Verification code is required'})
        }
    
    print(f"Confirming user: {username}")
    
    # Step 1: Confirm user in Cognito
    try:
        cognito.confirm_sign_up(
            ClientId=CLIENT_ID,
            SecretHash=generate_secret_hash(username, CLIENT_ID, CLIENT_SECRET),
            Username=username,
            ConfirmationCode=code
        )
        print(f"✅ User {username} confirmed in Cognito")
        
    except cognito.exceptions.CodeMismatchException:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid verification code'})
        }
    except cognito.exceptions.ExpiredCodeException:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Verification code has expired. Please request a new one.'})
        }
    except cognito.exceptions.NotAuthorizedException:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'User cannot be confirmed'})
        }
    except Exception as cognito_error:
        print(f"❌ Cognito error: {str(cognito_error)}")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': str(cognito_error)})
        }
    
    # Step 2: Save user to DynamoDB
    table = dynamodb.Table(USERS_TABLE)
    
    user_item = {
        'id': username,  # Partition Key
        'username': username,
        'email': email,
        'name': name,
        'role': role,
        'confirmedAt': datetime.utcnow().isoformat() + 'Z'
    }
    
    try:
        table.put_item(Item=user_item)
        print(f"✅ User {username} saved to DynamoDB")
    except Exception as db_error:
        print(f"⚠️ DynamoDB save failed: {str(db_error)}")
        # Don't fail the request if Cognito confirm succeeded
        # User can still login, profile will be created on first login
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'message': 'Email verified successfully',
            'item': user_item
        })
    }

def handle_resend(username, headers):
    """Handle resending verification code"""
    print(f"Resending verification code for: {username}")
    
    try:
        cognito.resend_confirmation_code(
            ClientId=CLIENT_ID,
            SecretHash=generate_secret_hash(username, CLIENT_ID, CLIENT_SECRET),
            Username=username
        )
        print(f"✅ Verification code resent to {username}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': 'Verification code has been resent to your email'
            })
        }
        
    except cognito.exceptions.UserNotFoundException:
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'User not found'})
        }
    except cognito.exceptions.InvalidParameterException:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'User is already confirmed'})
        }
    except cognito.exceptions.LimitExceededException:
        return {
            'statusCode': 429,
            'headers': headers,
            'body': json.dumps({'error': 'Too many requests. Please try again later.'})
        }
    except Exception as e:
        print(f"❌ Resend error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
