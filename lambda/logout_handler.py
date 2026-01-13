import json
import boto3
import os

cognito = boto3.client('cognito-idp')

def lambda_handler(event, context):
    """
    Handle user logout by invalidating access token
    POST /api/logout
    Headers: { "Authorization": "Bearer <access_token>" }
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
        # Get access token from Authorization header
        auth_header = event.get('headers', {}).get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Missing or invalid authorization header'})
            }
        
        access_token = auth_header.replace('Bearer ', '')
        
        # Global sign out (invalidates all tokens)
        cognito.global_sign_out(AccessToken=access_token)
        
        print(f"✅ User logged out successfully")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Logout successful'})
        }
        
    except cognito.exceptions.NotAuthorizedException:
        print(f"❌ Invalid or expired token")
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid or expired token'})
        }
    
    except Exception as e:
        print(f"❌ Logout error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Logout failed',
                'message': str(e)
            })
        }
