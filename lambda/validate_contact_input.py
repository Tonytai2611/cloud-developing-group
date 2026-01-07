import re


def lambda_handler(event, context):
    try:
        # Parse the input payload from Step Functions
        name = event.get('name')
        email = event.get('email')
        message = event.get('message')

        print(f"Parsed name: {name}, email: {email}, message: {message}")
        # Basic validation
        if not name or not name.strip():
            raise ValueError("Validation failed: 'name' is missing or empty")
        if not email or not email.strip():
            raise ValueError("Validation failed: 'email' is missing or empty")
        if not message or not message.strip():
            raise ValueError(
                "Validation failed: 'message' is missing or empty")

        # Validate email format
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if not re.match(email_regex, email):
            raise ValueError("Validation failed: Invalid email format")

        # If validation passes, return success
        return {
            "status": "VALIDATION_SUCCESS",
            "input": event  # Pass the input forward
        }
    except Exception as e:
        print(f"Validation error: {str(e)}")
        # Raise an exception to indicate a failure
        raise e
