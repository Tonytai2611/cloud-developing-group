import boto3
import json
import os

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
USERS_TABLE = os.environ.get('USERS_TABLE')  # Table name from environment variables


def handler(event, context):
    """
    Main Lambda handler function for handling GET and PUT requests.
    """
    http_method = event.get("httpMethod")
    path_parameters = event.get("pathParameters", {})
    user_id = path_parameters.get("id", None)

    if not user_id:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "User ID is required"})
        }

    if http_method == "GET":
        return fetch_user(user_id)
    elif http_method == "PUT":
        return update_user(user_id, event.get("body"))
    else:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": f"Unsupported HTTP method: {http_method}"})
        }


def fetch_user(user_id):
    """
    Fetch user data by ID from DynamoDB.
    """
    table = dynamodb.Table(USERS_TABLE)

    try:
        # Get user from DynamoDB
        response = table.get_item(Key={"id": user_id})
        user = response.get("Item")

        if not user:
            return {
                "statusCode": 404,
                "body": json.dumps({"message": "User not found"})
            }

        # Exclude password from the response
        user.pop("password", None)

        return {
            "statusCode": 200,
            "body": json.dumps(user)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error", "error": str(e)})
        }


def update_user(user_id, request_body):
    """
    Update user data (name, email, or password) in DynamoDB.
    """
    if not request_body:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Request body is required"})
        }

    table = dynamodb.Table(USERS_TABLE)

    try:
        # Parse request body
        data = json.loads(request_body)
        name = data.get("name")
        email = data.get("email")
        new_password = data.get("password")
        old_password = data.get("oldPassword")

        # If updating password, validate old password first
        if new_password:
            response = table.get_item(Key={"id": user_id})
            user = response.get("Item")

            if not user or user.get("password") != old_password:
                return {
                    "statusCode": 400,
                    "body": json.dumps({"message": "Incorrect old password"})
                }

            # Update password in DynamoDB
            table.update_item(
                Key={"id": user_id},
                UpdateExpression="SET #password = :password",
                ExpressionAttributeNames={"#password": "password"},
                ExpressionAttributeValues={":password": new_password}
            )
            return {
                "statusCode": 200,
                "body": json.dumps({"message": "Password updated successfully"})
            }

        # Update other fields (name, email)
        update_expression = []
        expression_attribute_names = {}
        expression_attribute_values = {}

        if name:
            update_expression.append("#name = :name")
            expression_attribute_names["#name"] = "name"
            expression_attribute_values[":name"] = name

        if email:
            update_expression.append("#email = :email")
            expression_attribute_names["#email"] = "email"
            expression_attribute_values[":email"] = email

        if update_expression:
            table.update_item(
                Key={"id": user_id},
                UpdateExpression="SET " + ", ".join(update_expression),
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values
            )

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "User details updated successfully"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error", "error": str(e)})
        }
