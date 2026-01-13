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
        'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS'
    }
    
    # Handle OPTIONS request for CORS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Get access token from Authorization header (Case Insensitive)
        headers_incoming = event.get('headers', {})
        # Normalize keys to lowercase
        headers_dict = {k.lower(): v for k, v in headers_incoming.items()}
        auth_header = headers_dict.get('authorization', '')
        
        print(f"DEBUG: Headers received: {json.dumps(headers_incoming)}")
        print(f"DEBUG: Auth Header found: {auth_header[:20]}...")
        
        if not auth_header.lower().startswith('bearer '):
            print("❌ Missing or invalid authorization header format")
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Missing or invalid authorization header'})
            }
        
        access_token = auth_header.split(' ')[1]
        
        # Get user info from Cognito
        try:
            user_info = cognito.get_user(AccessToken=access_token)
        except Exception as cognito_err:
            print(f"❌ Cognito get_user failed: {str(cognito_err)}")
            raise cognito_err

        
        # Extract username and attributes
        username = user_info['Username']
        attributes = {}
        for attr in user_info['UserAttributes']:
            attributes[attr['Name']] = attr['Value']
        
        # Check if admin
        is_admin = attributes.get('custom:role') == 'admin'
        
        # Get additional user data from DynamoDB
        table = dynamodb.Table(USERS_TABLE)

        # --- HANDLE PUT (UPDATE) ---
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        if http_method == 'PUT':
            try:
                body = json.loads(event.get('body', '{}'))
                name = body.get('name')
                email = body.get('email')
                
                update_expr = []
                expr_names = {}
                expr_values = {}
                
                if name:
                    update_expr.append('#n = :n')
                    expr_names['#n'] = 'name'
                    expr_values[':n'] = name
                if email:
                    update_expr.append('#e = :e')
                    expr_names['#e'] = 'email'
                    expr_values[':e'] = email
                
                if not update_expr:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'No fields to update'})
                    }
                
                # Update DynamoDB
                # Key must match schema: 'id' is the partition key
                upd_resp = table.update_item(
                    Key={'id': username},
                    UpdateExpression='SET ' + ', '.join(update_expr),
                    ExpressionAttributeNames=expr_names,
                    ExpressionAttributeValues=expr_values,
                    ReturnValues='ALL_NEW'
                )
                
                updated_item = decimal_to_native(upd_resp.get('Attributes', {}))
                
                # Check admin for response
                db_role = updated_item.get('role')
                final_role = db_role or attributes.get('custom:role') or 'customer'
                updated_item['isAdmin'] = (final_role == 'admin')
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'Profile updated', 'userInfo': updated_item})
                }
                
            except Exception as e:
                print(f"❌ Update failed: {str(e)}")
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps({'error': 'Failed to update profile', 'details': str(e)})
                }
        try:
            # Table uses 'id' as Partition Key, which stores the username
            db_response = table.get_item(Key={'id': username})
            db_user = decimal_to_native(db_response.get('Item', {}))
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
