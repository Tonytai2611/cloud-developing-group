import json
import boto3
import os
import hmac
import hashlib
import base64
from decimal import Decimal

cognito = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb')

CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID')
CLIENT_SECRET = os.environ.get('COGNITO_CLIENT_SECRET')
USERS_TABLE = os.environ.get('USERS_TABLE', 'USERS_TABLE')

def generate_secret_hash(username):
    """Generate SECRET_HASH for Cognito"""
    message = username + CLIENT_ID
    dig = hmac.new(
        CLIENT_SECRET.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()

def lambda_handler(event, context):
    """
    Handle user login with Cognito
    POST /api/login
    Body: { "username": "user", "password": "pass" }
    """
    
    # CORS headers
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
    
    # Handle OPTIONS request for CORS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        username = body.get('username')
        password = body.get('password')
        
        if not username or not password:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Username and password are required'})
            }
        
        print(f"Login attempt for user: {username}")
        
        # Generate SECRET_HASH
        secret_hash = generate_secret_hash(username)
        
        # Authenticate with Cognito
        auth_response = cognito.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow='USER_PASSWORD_AUTH',
            AuthParameters={
                'USERNAME': username,
                'PASSWORD': password,
                'SECRET_HASH': secret_hash
            }
        )
        
        # Get tokens
        tokens = auth_response['AuthenticationResult']
        access_token = tokens['AccessToken']
        id_token = tokens['IdToken']
        refresh_token = tokens['RefreshToken']
        
        # Get user info from Cognito
        user_info = cognito.get_user(AccessToken=access_token)
        
        # Extract user attributes
        attributes = {}
        for attr in user_info['UserAttributes']:
            attributes[attr['Name']] = attr['Value']
        
        # Check if user is admin
        is_admin = attributes.get('custom:role') == 'admin'
        
        # Get additional user data from DynamoDB
        table = dynamodb.Table(USERS_TABLE)
        try:
            # Table uses 'id' as Partition Key, which stores the username
            db_response = table.get_item(Key={'id': username})
            db_user = db_response.get('Item', {})
        except Exception as db_error:
            print(f"DynamoDB error: {str(db_error)}")
            db_user = {}
        
        # Determine role: DynamoDB > Cognito > 'customer'
        db_role = db_user.get('role')
        cognito_role = attributes.get('custom:role')
        final_role = db_role or cognito_role or 'customer'
        
        # Check if admin
        is_admin = final_role == 'admin'
        
        # Merge user data
        user_data = {
            'username': username,
            'email': attributes.get('email', ''),
            'name': attributes.get('name', ''),
            'role': final_role,
            'isAdmin': is_admin,
            **{k: v for k, v in db_user.items() if k != 'role'}
        }
        
        print(f"✅ Login successful for {username} (admin: {is_admin})")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': 'Login successful',
                'accessToken': access_token,
                'idToken': id_token,
                'refreshToken': refresh_token,
                'expiresIn': tokens.get('ExpiresIn', 3600),
                'isAdmin': is_admin,
                'userInfo': user_data
            })
        }
        
    except cognito.exceptions.NotAuthorizedException:
        print(f"❌ Invalid credentials for {username}")
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid username or password'})
        }
    
    except cognito.exceptions.UserNotFoundException:
        print(f"❌ User not found: {username}")
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid username or password'})
        }
    
    except cognito.exceptions.UserNotConfirmedException:
        print(f"❌ User not confirmed: {username}")
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({
                'error': 'User not confirmed',
                'message': 'Please verify your email address'
            })
        }
    
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Login failed',
                'message': str(e)
            })
        }
