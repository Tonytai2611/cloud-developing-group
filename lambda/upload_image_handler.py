import boto3
import base64
import json

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
}

def lambda_handler(event, context):
    print("EVENT:", json.dumps(event, default=str))
    
    # Handle OPTIONS for CORS preflight
    http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "POST")
    if http_method == "OPTIONS":
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': ''
        }
    
    try:
        # Parse body if it's a string (HTTP API v2)
        body = event.get('body', '{}')
        if isinstance(body, str):
            body = json.loads(body)
        
        # Extract file and fileName
        file_data = body.get('file')
        file_name = body.get('fileName')

        if not file_data or not file_name:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'Missing file or fileName'})
            }

        # Decode base64
        file_bytes = base64.b64decode(file_data)

        # Determine content type
        content_type = 'image/jpeg'
        if file_name.lower().endswith('.png'):
            content_type = 'image/png'
        elif file_name.lower().endswith('.webp'):
            content_type = 'image/webp'
        elif file_name.lower().endswith('.gif'):
            content_type = 'image/gif'

        # Upload to S3
        s3 = boto3.client('s3')
        bucket_name = 'brewcraft-images'
        s3.put_object(
            Bucket=bucket_name,
            Key=file_name,
            Body=file_bytes,
            ContentType=content_type,
            ACL='public-read'  # Make publicly accessible
        )

        # Generate S3 URL
        s3_url = f'https://{bucket_name}.s3.amazonaws.com/{file_name}'

        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'message': 'File uploaded successfully!',
                'url': s3_url,
                'fileName': file_name
            })
        }
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)})
        }
