import json
import boto3

# Initialize Step Functions client
step_functions = boto3.client('stepfunctions')


def lambda_handler(event, context):
    try:
        print("Received event:", event)  # Log the input event

        # Parse the input from the event body
        if 'body' not in event:
            raise ValueError("Missing 'body' in the event payload")

        body = json.loads(event['body'])
        print("Parsed body:", body)  # Log the parsed body

        name = body.get('name')
        email = body.get('email')
        message = body.get('message')

        # Log extracted values
        print(
            f"Extracted values - Name: {name}, Email: {email}, Message: {message}")

        # Validate required fields
        if not name or not email or not message:
            raise ValueError("Validation failed: Missing required fields")

        # Example of Step Function input payload
        step_function_input = {
            "name": name,
            "email": email,
            "message": message,
        }

        # Log the Step Function input
        print("Step Function Input:", step_function_input)

        # Start the Step Function execution
        response = step_functions.start_execution(
            stateMachineArn='arn:aws:states:us-east-1:533266957010:stateMachine:ContactProcessStateMachine',
            input=json.dumps(step_function_input)
        )

        # Log the Step Function response
        print("Step Function Start Execution Response:", response)

        # Return success response
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Email request sent successfully."})
        }
    except Exception as e:
        # Log the error
        print(f"Error invoking Step Function: {str(e)}")

        # Return error response
        return {
            "statusCode": 500,
            "body": json.dumps({"message": f"Failed to send email request: {str(e)}"})
        }
