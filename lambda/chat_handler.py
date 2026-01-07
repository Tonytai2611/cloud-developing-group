import boto3
import json
import os
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
connections_table = dynamodb.Table('CHAT_CONNECTIONS')
messages_table = dynamodb.Table('CHAT_MESSAGES')

# API Gateway Management API client (for sending messages back to clients)
# Endpoint will be set from environment variable
APIGW_ENDPOINT = os.environ.get('APIGW_ENDPOINT', '')

def get_apigw_client(event):
    """Create API Gateway Management API client with correct endpoint"""
    domain_name = event['requestContext']['domainName']
    stage = event['requestContext']['stage']
    endpoint_url = f"https://{domain_name}/{stage}"
    
    return boto3.client('apigatewaymanagementapi', endpoint_url=endpoint_url)

def lambda_handler(event, context):
    """
    Main handler for WebSocket chat
    Routes: $connect, $disconnect, sendMessage, getMessages
    """
    
    route_key = event.get('requestContext', {}).get('routeKey')
    connection_id = event.get('requestContext', {}).get('connectionId')
    
    try:
        if route_key == '$connect':
            return handle_connect(event, connection_id)
        elif route_key == '$disconnect':
            return handle_disconnect(connection_id)
        elif route_key == 'sendMessage':
            return handle_send_message(event, connection_id)
        elif route_key == 'getMessages':
            return handle_get_messages(event, connection_id)
        elif route_key == 'getUsers':
            return handle_get_users(event, connection_id)
        else:
            return {'statusCode': 400, 'body': 'Unknown route'}
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'statusCode': 500, 'body': str(e)}

def handle_connect(event, connection_id):
    """
    Handle new WebSocket connection
    Store connectionId + userId in DynamoDB
    """
    
    # Get userId and role from query parameters
    # Example: wss://...?userId=user@email.com&role=admin
    query_params = event.get('queryStringParameters') or {}
    user_id = query_params.get('userId', 'guest')
    role = query_params.get('role', 'customer')
    
    # Store connection
    connections_table.put_item(
        Item={
            'connectionId': connection_id,
            'userId': user_id,
            'role': role,
            'connectedAt': datetime.utcnow().isoformat()
        }
    )
    
    return {'statusCode': 200, 'body': 'Connected'}

def handle_disconnect(connection_id):
    """
    Handle WebSocket disconnection
    Remove connection from DynamoDB
    """
    
    connections_table.delete_item(
        Key={'connectionId': connection_id}
    )
    
    return {'statusCode': 200, 'body': 'Disconnected'}

def handle_send_message(event, connection_id):
    """
    Handle sending message
    - Save message to CHAT_MESSAGES table
    - Find recipient's connectionId
    - Send message to recipient via WebSocket
    """
    
    body = json.loads(event.get('body', '{}'))
    
    sender_id = body.get('senderId')
    recipient_id = body.get('recipientId')
    message = body.get('message')
    
    if not all([sender_id, recipient_id, message]):
        return {'statusCode': 400, 'body': 'Missing required fields'}
    
    # Create conversation ID (sorted for consistency)
    conversation_id = '_'.join(sorted([sender_id, recipient_id]))
    
    # Save message to database
    message_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    try:
        messages_table.put_item(
            Item={
                'messageId': message_id,
                'conversationId': conversation_id,
                'senderId': sender_id,
                'recipientId': recipient_id,
                'message': message,
                'timestamp': timestamp,
                'read': False
            }
        )
    except Exception as e:
        print(f"❌ Error saving message: {str(e)}")
        raise

    
    # Find recipient's connection
    try:
        response = connections_table.scan(
            FilterExpression='userId = :userId',
            ExpressionAttributeValues={':userId': recipient_id}
        )
        
        items = response.get('Items', [])
        
        # Get API Gateway client
        apigw_client = get_apigw_client(event)
        
        if items:
            # Send to all recipient's connections (in case multiple devices)
            for item in items:
                recipient_connection_id = item['connectionId']
                
                try:
                    apigw_client.post_to_connection(
                        ConnectionId=recipient_connection_id,
                        Data=json.dumps({
                            'type': 'newMessage',
                            'messageId': message_id,
                            'senderId': sender_id,
                            'message': message,
                            'timestamp': timestamp
                        }).encode('utf-8')
                    )
                except Exception as send_error:
                    print(f"⚠️ Failed to send to {recipient_connection_id}: {str(send_error)}")
                    # Connection might be stale, remove it
                    connections_table.delete_item(
                        Key={'connectionId': recipient_connection_id}
                    )
    except Exception as e:
        print(f"❌ Error sending message: {str(e)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({'messageId': message_id, 'timestamp': timestamp})
    }

def handle_get_messages(event, connection_id):
    """
    Handle fetching message history
    Query messages between two users
    """
    
    body = json.loads(event.get('body', '{}'))
    
    user1 = body.get('user1')
    user2 = body.get('user2')
    
    if not all([user1, user2]):
        return {'statusCode': 400, 'body': 'Missing user IDs'}
    
    # Create conversation ID
    conversation_id = '_'.join(sorted([user1, user2]))
    
    # Query messages
    from boto3.dynamodb.conditions import Key
    
    response = messages_table.query(
        IndexName='conversationId-timestamp-index',
        KeyConditionExpression=Key('conversationId').eq(conversation_id),
        ScanIndexForward=True  # Oldest first
    )
    
    messages = response.get('Items', [])
    
    # Convert Decimal to native types
    messages = decimal_to_native(messages)
    
    # Send messages back to client via WebSocket
    apigw_client = get_apigw_client(event)
    
    try:
        apigw_client.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({
                'type': 'messageHistory',
                'messages': messages
            }).encode('utf-8')
        )
    except Exception as e:
        print(f"❌ Error sending message history: {str(e)}")
    
    return {
        'statusCode': 200,
        'body': json.dumps({'count': len(messages)})
    }

def handle_get_users(event, connection_id):
    """
    Handle fetching online users by role
    """
    body = json.loads(event.get('body', '{}'))
    role_filter = body.get('role') # Optional: 'admin' or 'customer'
    
    scan_kwargs = {}
    if role_filter:
        scan_kwargs = {
            'FilterExpression': '#r = :role',
            'ExpressionAttributeNames': {'#r': 'role'},
            'ExpressionAttributeValues': {':role': role_filter}
        }
        
    response = connections_table.scan(**scan_kwargs)
    items = response.get('Items', [])
    
    # Extract unique users
    users = {}
    for item in items:
        uid = item.get('userId')
        if uid and uid != 'guest':
             users[uid] = {
                 'userId': uid, 
                 'role': item.get('role'),
                 'status': 'online'
             }
             
    user_list = list(users.values())
    
    apigw_client = get_apigw_client(event)
    try:
        apigw_client.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps({
                'type': 'userList',
                'users': user_list,
                'roleFilter': role_filter
            }).encode('utf-8')
        )
    except Exception as e:
        print(f"❌ Error sending user list: {str(e)}")
        
    return {'statusCode': 200, 'body': json.dumps({'count': len(user_list)})}

def decimal_to_native(obj):
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    else:
        return obj
