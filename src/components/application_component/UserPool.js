import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
    UserPoolId: "us-east-1_phpgibZJD",
    ClientId: "10g093m0qo9fj9hsar5ngtp8ej",
};

const UserPool = new CognitoUserPool(poolData);

export default UserPool;
