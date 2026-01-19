import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
    UserPoolId: "us-east-1_TzN1HHv4Y",
    ClientId: "6567k65pghoo7m77be0ru8g9dj",
};

const UserPool = new CognitoUserPool(poolData);

export default UserPool;
