import boto3
import json
from decimal import Decimal

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('TABLES_TABLE')

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
}

def decimal_to_native(obj):
    """Convert Decimal to native Python types"""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    elif isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    return obj

def convert_to_decimal(data):
    """Convert float to Decimal for DynamoDB"""
    if isinstance(data, list):
        return [convert_to_decimal(i) for i in data]
    elif isinstance(data, dict):
        return {k: convert_to_decimal(v) for k, v in data.items()}
    elif isinstance(data, float):
        return Decimal(str(data))
    return data

def lambda_handler(event, context):
    """Main handler for table management"""
    
    # Handle CORS preflight
    http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
    if http_method == "OPTIONS":
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}
    
    try:
        # Parse body if needed
        body = {}
        if http_method in ["POST", "PUT", "DELETE"]:
            body_str = event.get('body', '{}')
            body = json.loads(body_str) if isinstance(body_str, str) else body_str
        
        # Route to appropriate function
        if http_method == "GET":
            return get_tables()
        elif http_method == "POST":
            return create_table(body)
        elif http_method == "PUT":
            return update_table(body)
        elif http_method == "DELETE":
            return delete_table(body)
        else:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Unsupported HTTP method'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def get_tables():
    """Get all tables"""
    try:
        response = table.scan()
        items = decimal_to_native(response.get('Items', []))
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'Tables retrieved successfully',
                'data': items
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def generate_table_id():
    """Generate readable table ID: TBL-001, TBL-002, etc."""
    try:
        # Get count of all tables
        response = table.scan()
        count = len(response.get('Items', []))
        sequence = str(count + 1).zfill(3)  # 001, 002, 003...
        
        return f'TBL-{sequence}'
    except Exception as e:
        # Fallback to UUID if error
        print(f"Error generating table ID: {e}")
        return f'TBL-{str(uuid.uuid4())[:8]}'

def create_table(data):
    """Create new table"""
    try:
        # Generate readable table ID
        if not data.get("id"):
            data["id"] = generate_table_id()
        
        # Validate required fields
        if not data.get("tableNumber") or not data.get("seats"):
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Missing required fields: tableNumber, seats'})
            }
        
        # Set default status if not provided
        if not data.get("status"):
            data["status"] = "AVAILABLE"
        
        # Validate status
        if data.get("status") not in ["AVAILABLE", "RESERVED"]:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Status must be AVAILABLE or RESERVED'})
            }
        
        # Convert to Decimal
        data = convert_to_decimal(data)
        
        # Save to DynamoDB
        table.put_item(Item=data)
        
        return {
            'statusCode': 201,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'Table created successfully',
                'data': decimal_to_native(data)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def update_table(data):
    """Update existing table"""
    try:
        if not data.get('id'):
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'ID is required for updates'})
            }
        
        # Validate status if provided
        if data.get("status") and data.get("status") not in ["AVAILABLE", "RESERVED"]:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Status must be AVAILABLE or RESERVED'})
            }
        
        # Build update expression
        update_expression = "SET "
        expression_attribute_values = {}
        expression_attribute_names = {}
        
        for key, value in data.items():
            if key != "id" and value is not None:
                # Handle reserved keywords
                if key in ["status"]:
                    expression_attribute_names[f"#{key}"] = key
                    update_expression += f"#{key} = :{key}, "
                else:
                    update_expression += f"{key} = :{key}, "
                expression_attribute_values[f":{key}"] = convert_to_decimal(value)
        
        update_expression = update_expression.rstrip(", ")
        
        # Update item
        kwargs = {
            'Key': {'id': data['id']},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_attribute_values,
            'ReturnValues': "ALL_NEW"
        }
        
        if expression_attribute_names:
            kwargs['ExpressionAttributeNames'] = expression_attribute_names
        
        response = table.update_item(**kwargs)
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'Table updated successfully',
                'data': decimal_to_native(response.get("Attributes", {}))
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def delete_table(data):
    """Delete table - only if not occupied"""
    try:
        if not data.get('id'):
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'ID is required for deletion'})
            }
        
        # Check if table is reserved before deleting
        response = table.get_item(Key={'id': str(data['id'])})
        if 'Item' in response:
            if response['Item'].get('status') == 'RESERVED':
                return {
                    'statusCode': 400,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': 'Cannot delete table that is currently reserved!'})
                }
        
        table.delete_item(Key={'id': str(data['id'])})
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Table deleted successfully'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
