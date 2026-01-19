import os
import json
import boto3
import hmac
import hashlib
import base64

cognito = boto3.client('cognito-idp')

def generate_secret_hash(username, client_id, client_secret):
    message = username + client_id
    dig = hmac.new(
        client_secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).digest()
    return base64.b64encode(dig).decode()

def lambda_handler(event, context):
    CLIENT_ID = os.environ['COGNITO_CLIENT_ID']
    CLIENT_SECRET = os.environ['COGNITO_CLIENT_SECRET']
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    body = json.loads(event['body'])
    username = body['username']
    password = body['password']
    email = body['email']
    name = body['name']
    role = body.get('role', 'Customer')

    try:
        cognito.sign_up(
            ClientId=CLIENT_ID,
            SecretHash=generate_secret_hash(username, CLIENT_ID, CLIENT_SECRET),
            Username=username,
            Password=password,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'name', 'Value': name},
                {'Name': 'custom:role', 'Value': role}
            ]
        )
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Registration successful'})}
    except Exception as e:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': str(e)})}