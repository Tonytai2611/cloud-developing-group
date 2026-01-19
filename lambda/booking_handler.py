import boto3
import json
import uuid
import os
from decimal import Decimal
from datetime import datetime

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
booking_table = dynamodb.Table('BOOKING_FOODS_TABLE')
table_table = dynamodb.Table('TABLES_TABLE')

# Initialize SNS client
sns_client = boto3.client('sns')

# Dual SNS Topics for two-way notifications
ADMIN_TOPIC_ARN = os.environ.get('ADMIN_TOPIC_ARN', 'arn:aws:sns:us-east-1:058053292709:AdminBookingAlerts')
CUSTOMER_TOPIC_ARN = os.environ.get('CUSTOMER_TOPIC_ARN', 'arn:aws:sns:us-east-1:058053292709:CustomerNotifications')

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
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
    """Main handler for booking management"""
    
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
        
        # Get query parameters for GET requests
        query_params = event.get("queryStringParameters") or {}
        
        # Route to appropriate function
        if http_method == "GET":
            return get_bookings(query_params)
        elif http_method == "POST":
            return create_booking(body)
        elif http_method == "PUT":
            return update_booking(body)
        elif http_method == "DELETE":
            return delete_booking(body)
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

def get_bookings(query_params):
    """Get all bookings or filter by user"""
    try:
        user_id = query_params.get('userId')
        
        if user_id:
            # Get bookings for specific user
            response = booking_table.scan(
                FilterExpression='userId = :uid',
                ExpressionAttributeValues={':uid': user_id}
            )
        else:
            # Get all bookings (for admin)
            response = booking_table.scan()
        
        items = decimal_to_native(response.get('Items', []))
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'Bookings retrieved successfully',
                'data': items
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def generate_booking_id(date):
    """Generate readable booking ID: BK-YYYYMMDD-XXX"""
    try:
        # Format: BK-20240215-001
        date_part = date.replace('-', '')  # 20240215
        
        # Get count of bookings for this date
        response = booking_table.scan(
            FilterExpression='begins_with(id, :prefix)',
            ExpressionAttributeValues={':prefix': f'BK-{date_part}'}
        )
        
        count = len(response.get('Items', []))
        sequence = str(count + 1).zfill(3)  # 001, 002, 003...
        
        return f'BK-{date_part}-{sequence}'
    except Exception as e:
        # Fallback to UUID if error
        print(f"Error generating booking ID: {e}")
        return f'BK-{str(uuid.uuid4())[:8]}'

def create_booking(data):
    """Create new booking and reserve table"""
    try:
        # Validate required fields
        required_fields = ['customerName', 'phone', 'email', 'date', 'time', 'guests']
        for field in required_fields:
            if not data.get(field):
                return {
                    'statusCode': 400,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Generate booking ID with readable format: BK-YYYYMMDD-XXX
        booking_id = generate_booking_id(data['date'])
        
        # Get userId (from auth or guest)
        user_id = data.get('userId', 'guest')
        
        # Find available table for the number of guests
        table_id = data.get('tableId')
        
        if not table_id:
            # Auto-find available table
            table_id = find_available_table(data['guests'], data['date'], data['time'])
            if not table_id:
                return {
                    'statusCode': 400,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': 'No available tables for the requested time and party size'})
                }
        else:
            # Check if specified table is available
            if not is_table_available(table_id, data['date'], data['time']):
                return {
                    'statusCode': 400,
                    'headers': CORS_HEADERS,
                    'body': json.dumps({'error': 'Selected table is not available at this time'})
                }
        
        # Get table info
        table_response = table_table.get_item(Key={'id': table_id})
        if 'Item' not in table_response:
            return {
                'statusCode': 404,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Table not found'})
            }
        
        table_item = table_response['Item']
        
        # Create booking
        booking_data = {
            'id': booking_id,
            'userId': user_id,
            'customerName': data['customerName'],
            'phone': data['phone'],
            'email': data['email'],
            'date': data['date'],
            'time': data['time'],
            'guests': data['guests'],
            'tableId': table_id,
            'tableNumber': table_item.get('tableNumber'),
            'status': 'PENDING',
            'selectedItems': data.get('selectedItems', []),
            'total': data.get('total', 0),
            'specialRequests': data.get('specialRequests', ''),
            'createdAt': datetime.utcnow().isoformat()
        }
        
        booking_data = convert_to_decimal(booking_data)
        booking_table.put_item(Item=booking_data)
        
        # Reserve the table
        table_table.update_item(
            Key={'id': table_id},
            UpdateExpression="SET #status = :status",
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'RESERVED'}
        )
        
        # Notify admin of new booking
        try:
            admin_message = f"""🔔 NEW BOOKING RECEIVED

Customer Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name: {data['customerName']}
📧 Email: {data['email']}
📞 Phone: {data['phone']}

Booking Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Booking ID: {booking_id}
📅 Date: {data['date']}
🕐 Time: {data['time']}
👥 Guests: {data['guests']} people
🪑 Table: {table_item.get('tableNumber', 'N/A')}

Status: PENDING ⏳
Action Required: Please review and approve/reject in Admin Dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Brewcraft Restaurant Management System
"""
            
            sns_client.publish(
                TopicArn=ADMIN_TOPIC_ARN,
                Subject='🔔 New Booking - Action Required',
                Message=admin_message
            )
            
            print(f"✅ Admin notified: {booking_id}")
            
        except Exception as sns_error:
            print(f"⚠️ Admin notification failed: {str(sns_error)}")
        
        return {
            'statusCode': 201,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'Booking created successfully',
                'data': decimal_to_native(booking_data)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def find_available_table(guests, date, time):
    """Find an available table that fits the party size"""
    try:
        # Get all tables with enough seats
        response = table_table.scan(
            FilterExpression='seats >= :guests AND #status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':guests': Decimal(str(guests)),  # Convert to Decimal for DynamoDB
                ':status': 'AVAILABLE'
            }
        )
        
        tables = response.get('Items', [])
        
        # Check each table for availability at the requested time
        for table in tables:
            if is_table_available(table['id'], date, time):
                return table['id']
        
        return None
    except Exception as e:
        print(f"Error finding available table: {e}")
        return None

def is_table_available(table_id, date, time):
    """Check if table is available at specific date/time"""
    try:
        # Check if there's any booking for this table at this time
        response = booking_table.scan(
            FilterExpression='tableId = :tid AND #date = :date AND #time = :time AND #status IN (:pending, :confirmed)',
            ExpressionAttributeNames={
                '#date': 'date',
                '#time': 'time',
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':tid': table_id,
                ':date': date,
                ':time': time,
                ':pending': 'PENDING',
                ':confirmed': 'CONFIRMED'
            }
        )
        
        # If no bookings found, table is available
        return len(response.get('Items', [])) == 0
    except Exception as e:
        print(f"Error checking table availability: {e}")
        return False

def update_booking(data):
    """Update booking status"""
    try:
        if not data.get('id'):
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Booking ID is required'})
            }
        
        # Get current booking
        booking_response = booking_table.get_item(Key={'id': data['id']})
        if 'Item' not in booking_response:
            return {
                'statusCode': 404,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Booking not found'})
            }
        
        current_booking = booking_response['Item']
        
        # Build update expression
        update_expression = "SET "
        expression_attribute_values = {}
        expression_attribute_names = {}
        
        for key, value in data.items():
            if key != "id" and value is not None:
                if key in ["status", "date", "time"]:
                    expression_attribute_names[f"#{key}"] = key
                    update_expression += f"#{key} = :{key}, "
                else:
                    update_expression += f"{key} = :{key}, "
                expression_attribute_values[f":{key}"] = convert_to_decimal(value)
        
        update_expression = update_expression.rstrip(", ")
        
        # Update booking
        kwargs = {
            'Key': {'id': data['id']},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_attribute_values,
            'ReturnValues': "ALL_NEW"
        }
        
        if expression_attribute_names:
            kwargs['ExpressionAttributeNames'] = expression_attribute_names
        
        response = booking_table.update_item(**kwargs)
        updated_item = response.get("Attributes", {})
        
        # If booking is cancelled/rejected, free the table
        if data.get('status') in ['CANCELLED', 'REJECTED']:
            table_table.update_item(
                Key={'id': current_booking['tableId']},
                UpdateExpression="SET #status = :status",
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': 'AVAILABLE'}
            )
        

        new_status = data.get('status')
        if new_status in ['CONFIRMED', 'REJECTED'] and CUSTOMER_TOPIC_ARN:
            try:
                # Prepare notification data
                notification_data = {
                    "type": "BOOKING_DECISION",
                    "email": str(updated_item.get('email', '')),
                    "customerName": str(updated_item.get('customerName', '')),
                    "bookingId": str(updated_item.get('id', '')),
                    "date": str(updated_item.get('date', '')),
                    "time": str(updated_item.get('time', '')),
                    "tableNumber": str(updated_item.get('tableNumber', '')),
                    "guests": int(updated_item.get('guests', 0)),
                    "status": new_status
                }
                
                # Format beautiful email message
                customer_name = notification_data['customerName']
                booking_id = notification_data['bookingId']
                date = notification_data['date']
                time = notification_data['time']
                table_number = notification_data['tableNumber']
                guests = notification_data['guests']
                
                if new_status == 'CONFIRMED':
                    email_message = f"""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🎉  BOOKING CONFIRMATION  🎉                      ║
║                                                              ║
║              BREWCRAFT RESTAURANT                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Dear {customer_name},

Great news! Your table reservation has been CONFIRMED.

┌──────────────────────────────────────────────────────────────┐
│  RESERVATION DETAILS                                         │
└──────────────────────────────────────────────────────────────┘

  📋  Booking ID      : {booking_id}
  📅  Date            : {date}
  🕐  Time            : {time}
  🪑  Table           : {table_number}
  👥  Party Size      : {guests} {'person' if guests == 1 else 'people'}

┌──────────────────────────────────────────────────────────────┐
│  IMPORTANT INFORMATION                                       │
└──────────────────────────────────────────────────────────────┘

  ✓  Please arrive 10 minutes before your reservation time
  ✓  Your table will be held for 15 minutes
  ✓  For any changes, please contact us in advance

┌──────────────────────────────────────────────────────────────┐
│  CONTACT US                                                  │
└──────────────────────────────────────────────────────────────┘

  📞  Phone    : +84 123 456 789
  📧  Email    : tonytai2611@gmail.com
  🌐  Website  : www.brewcraft.com
  📍  Address  : 123 Restaurant Street, Ho Chi Minh City

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We look forward to serving you! 🍽️

Best regards,
The Brewcraft Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
                else:  # REJECTED
                    email_message = f"""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           📋  BOOKING UPDATE  📋                            ║
║                                                              ║
║              BREWCRAFT RESTAURANT                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Dear {customer_name},

We apologize, but we are unable to confirm your reservation.

┌──────────────────────────────────────────────────────────────┐
│  REQUESTED BOOKING                                           │
└──────────────────────────────────────────────────────────────┘

  📋  Booking ID      : {booking_id}
  📅  Date            : {date}
  🕐  Time            : {time}
  👥  Party Size      : {guests} {'person' if guests == 1 else 'people'}

┌──────────────────────────────────────────────────────────────┐
│  REASON                                                      │
└──────────────────────────────────────────────────────────────┘

  Unfortunately, we are fully booked for this time slot.

┌──────────────────────────────────────────────────────────────┐
│  ALTERNATIVE OPTIONS                                         │
└──────────────────────────────────────────────────────────────┘

  ✓  Try a different time slot
  ✓  Choose an alternative date
  ✓  Contact us for special arrangements

┌──────────────────────────────────────────────────────────────┐
│  CONTACT US                                                  │
└──────────────────────────────────────────────────────────────┘

  📞  Phone    : +84 123 456 789
  📧  Email    : tonytai2611@gmail.com
  🌐  Website  : www.brewcraft.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We apologize for the inconvenience and hope to serve you soon.

Best regards,
The Brewcraft Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
                
                print(f"📧 Customer notification: {booking_id} ({new_status}) → {notification_data['email']}")
                
                # Publish to SNS with protocol-specific messages
                message_structure = {
                    "default": json.dumps(notification_data),
                    "email": email_message
                }
                
                sns_client.publish(
                    TopicArn=CUSTOMER_TOPIC_ARN,
                    Subject=f"✅ Booking {new_status} - Brewcraft Restaurant" if new_status == 'CONFIRMED' else f"❌ Booking {new_status} - Brewcraft Restaurant",
                    Message=json.dumps(message_structure),
                    MessageStructure='json',
                    MessageAttributes={
                        'bookingId': {'DataType': 'String', 'StringValue': notification_data['bookingId']},
                        'status': {'DataType': 'String', 'StringValue': new_status}
                    }
                )
                
                print(f"✅ Customer notified")
                
            except Exception as sns_error:
                print(f"⚠️ Customer notification failed: {str(sns_error)}")
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'Booking updated successfully',
                'data': decimal_to_native(updated_item)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }

def delete_booking(data):
    """Delete booking and free table"""
    try:
        if not data.get('id'):
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Booking ID is required'})
            }
        
        # Get booking to find table ID
        booking_response = booking_table.get_item(Key={'id': data['id']})
        if 'Item' in booking_response:
            table_id = booking_response['Item'].get('tableId')
            
            # Free the table
            if table_id:
                table_table.update_item(
                    Key={'id': table_id},
                    UpdateExpression="SET #status = :status",
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={':status': 'AVAILABLE'}
                )
        
        # Delete booking
        booking_table.delete_item(Key={'id': data['id']})
        
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'message': 'Booking deleted successfully'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
