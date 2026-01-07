import boto3
import json
from decimal import Decimal

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('MENU_TABLES')

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
}

def decimal_to_native(obj):
    """Convert Decimal to native Python types for JSON serialization"""
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    elif isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    return obj

def convert_to_decimal(data):
    """Convert float values to Decimal for DynamoDB compatibility"""
    if isinstance(data, list):
        return [convert_to_decimal(i) for i in data]
    elif isinstance(data, dict):
        return {k: convert_to_decimal(v) for k, v in data.items()}
    elif isinstance(data, float):
        return Decimal(str(data))
    return data

def lambda_handler(event, context):
    # Handle OPTIONS for CORS preflight
    if event.get("httpMethod") == "OPTIONS":
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': ''
        }
    
    try:
        # Support both REST API (v1) and HTTP API (v2) event formats
        http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")

        if http_method == "GET":
            return get_menu_items()
        elif http_method == "POST":
            body = json.loads(event.get("body", "{}"))
            return create_food_item(body)
        elif http_method == "PUT":
            body = json.loads(event.get("body", "{}"))
            return update_food_item(body)
        elif http_method == "DELETE":
            body = json.loads(event.get("body", "{}"))
            return delete_food_item(body)
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

def get_menu_items():
    try:
        response = table.scan()
        items = decimal_to_native(response.get('Items', []))
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Menu retrieved successfully', 'data': items})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def create_food_item(data):
    try:
        # Handle list of items
        if isinstance(data, list):
            for item in data:
                if not item.get("id") or not item.get("title") or not item.get("dishes"):
                    return {
                        'statusCode': 400,
                        'headers': CORS_HEADERS,
                        'body': json.dumps({'error': 'Missing required fields'})
                    }
                item["id"] = str(item["id"])
                table.put_item(Item=convert_to_decimal(item))
            return {
                'statusCode': 201,
                'headers': CORS_HEADERS,
                'body': json.dumps({'message': 'All food items created successfully'})
            }
        
        # Handle single item
        if not data.get("id") or not data.get("title") or not data.get("dishes"):
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Missing required fields'})
            }
        
        data["id"] = str(data["id"])
        table.put_item(Item=convert_to_decimal(data))
        
        return {
            'statusCode': 201,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'Food item created successfully',
                'data': decimal_to_native(data)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def update_food_item(data):
    try:
        if 'id' not in data:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Food ID is required for updates'})
            }

        data['id'] = str(data['id'])
        
        # Build update expression
        update_expression = "SET "
        expression_attribute_values = {}
        for key, value in data.items():
            if key != "id":
                update_expression += f"{key} = :{key}, "
                expression_attribute_values[f":{key}"] = convert_to_decimal(value)
        
        update_expression = update_expression.rstrip(", ")
        
        response = table.update_item(
            Key={'id': data['id']},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW"
        )
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'Food item updated successfully',
                'data': decimal_to_native(response.get("Attributes", {}))
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def delete_food_item(data):
    try:
        if 'id' not in data:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Food ID is required for deletion'})
            }
        
        table.delete_item(Key={'id': str(data['id'])})
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Food item deleted successfully'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
