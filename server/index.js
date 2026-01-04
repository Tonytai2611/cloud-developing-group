require('dotenv').config();
const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN
});

const cognito = new AWS.CognitoIdentityServiceProvider();
const { serialize, parse } = require('cookie');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;
const USERS_TABLE = process.env.USERS_TABLE || process.env.REACT_APP_USERS_TABLE;

function generateSecretHash(username) {
  if (!CLIENT_SECRET) return undefined;
  return crypto.createHmac('sha256', CLIENT_SECRET)
    .update(username + CLIENT_ID)
    .digest('base64');
}

app.post('/api/register', async (req, res) => {
  const { username, password, email, name } = req.body;
  if (!username || !password || !email) return res.status(400).json({ error: 'username/password/email required' });

  try {
    const secretHash = generateSecretHash(username);

    const params = {
      ClientId: CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        ...(name ? [{ Name: 'name', Value: name }] : [])
      ]
    };
    if (secretHash) params.SecretHash = secretHash;

    const signupResp = await cognito.signUp(params).promise();
    console.log('Cognito signUp response:', signupResp);

    // Return CodeDeliveryDetails so client knows where code sent
    res.json({ message: 'User registered in Cognito', signupResp });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, table: USERS_TABLE || null, region: AWS.config.region || process.env.AWS_REGION });
});

// confirm: confirm code then write to DynamoDB
app.post('/api/confirm', async (req, res) => {
  // Accept optional email/name/role from client to avoid relying on adminGetUser
  let { username, code, email, name, role } = req.body || {};
  if (!username || !code) return res.status(400).json({ error: 'username and code required' });

  try {
    const params = { ClientId: CLIENT_ID, Username: username, ConfirmationCode: code };
    const secretHash = generateSecretHash(username);
    if (secretHash) params.SecretHash = secretHash;

    await cognito.confirmSignUp(params).promise();
    console.log(`User ${username} confirmed in Cognito`);

    // If client didn't send email/name, try adminGetUser as a fallback
    if ((!email || !name) && process.env.COGNITO_USER_POOL_ID) {
      try {
        const adminResp = await cognito.adminGetUser({ UserPoolId: process.env.COGNITO_USER_POOL_ID, Username: username }).promise();
        const attrs = adminResp.UserAttributes || [];
        if (!email) email = attrs.find(a => a.Name === 'email')?.Value || null;
        if (!name) name = attrs.find(a => a.Name === 'name')?.Value || null;
      } catch (e) {
        console.warn('adminGetUser failed:', e.message || e);
      }
    }

    if (!USERS_TABLE) {
      console.error('USERS_TABLE not configured, cannot write to DB');
      return res.status(500).json({ error: 'Server misconfiguration: USERS_TABLE missing' });
    }

    // Normalize username to lowercase for consistent DynamoDB storage
    const normalizedUsername = username.toLowerCase();

    const userItem = {
      id: normalizedUsername,
      username: normalizedUsername,
      email: email || 'No Email',
      name: name || 'No Name',
      role: role || 'customer', // Use role from client or default to 'customer'
      confirmedAt: new Date().toISOString()
    };

    try {
      await dynamodb.put({ TableName: USERS_TABLE, Item: userItem }).promise();
      console.log('DynamoDB put succeeded for', username);

      // If role is 'admin', add user to Cognito 'admin' group
      if (role === 'admin' && process.env.COGNITO_USER_POOL_ID) {
        try {
          await cognito.adminAddUserToGroup({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: normalizedUsername,
            GroupName: 'admin'
          }).promise();
          console.log(`User ${normalizedUsername} added to 'admin' group in Cognito`);
        } catch (groupErr) {
          console.warn('Failed to add user to admin group:', groupErr.message || groupErr);
          // Don't fail the entire request if group assignment fails
        }
      }

      return res.json({ message: 'User confirmed and saved to DB', item: userItem });
    } catch (putErr) {
      console.error('DynamoDB put error:', putErr);
      return res.status(500).json({ error: 'DynamoDB put failed', detail: putErr.message || putErr });
    }
  } catch (err) {
    console.error('Confirm Error:', err);
    return res.status(400).json({ error: err.message || err });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });

  try {
    const secretHash = generateSecretHash(username);

    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      }
    };
    if (secretHash) params.AuthParameters.SECRET_HASH = secretHash;

    const response = await cognito.initiateAuth(params).promise();
    const auth = response.AuthenticationResult || {};

    // decode id token to build userInfo
    let userInfo = { username };
    if (auth.IdToken) {
      try {
        const payload = auth.IdToken.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
        const groups = decoded['cognito:groups'];
        let isAdmin = false;
        if (Array.isArray(groups)) isAdmin = groups.includes('admin');
        if (typeof groups === 'string') isAdmin = groups.split(',').includes('admin');
        userInfo = {
          username: decoded['cognito:username'] || username,
          email: decoded.email || null,
          name: decoded.name || null,
          isAdmin: isAdmin || false
        };
      } catch (e) {
        console.warn('Failed to parse IdToken', e.message || e);
      }
    }

    // set a non-httpOnly cookie for userInfo (matches CloudSample behavior)
    try {
      res.setHeader('Set-Cookie', [
        serialize('userInfo', JSON.stringify(userInfo), {
          sameSite: 'strict',
          secure: false,
          path: '/',
          maxAge: 60 * 60 * 24,
        }),
      ]);
    } catch (e) {
      console.warn('Failed to set cookie:', e.message || e);
    }

    res.json({ message: 'Login successful', isAdmin: userInfo.isAdmin });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// Get current user info from cookie
app.get('/api/me', (req, res) => {
  try {
    const cookies = parse(req.headers.cookie || '');
    const userInfoStr = cookies.userInfo;

    if (!userInfoStr) {
      // No cookie = not logged in, return null instead of error
      return res.json({ userInfo: null });
    }

    const userInfo = JSON.parse(userInfoStr);
    return res.json({ userInfo });
  } catch (error) {
    console.error('Error parsing userInfo cookie:', error);
    return res.json({ userInfo: null });
  }
});


// CloudSample: confirmUser (alias of /api/confirm but kept lightweight)
app.post('/api/confirmUser', async (req, res) => {
  if (!req.body || req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { username, verificationCode } = req.body;
  if (!username || !verificationCode) return res.status(400).json({ message: 'Missing username or verification code' });

  try {
    const params = {
      ClientId: CLIENT_ID,
      ConfirmationCode: verificationCode,
      Username: username,
    };
    const secretHash = generateSecretHash(username);
    if (secretHash) params.SecretHash = secretHash;

    const result = await cognito.confirmSignUp(params).promise();
    return res.status(200).json({ message: 'User confirmed successfully', result });
  } catch (err) {
    console.error('confirmUser error:', err);
    return res.status(400).json({ message: err.message || 'Confirm failed' });
  }
});

// Return user info from cookie
app.get('/api/me', (req, res) => {
  const cookies = parse(req.headers.cookie || '');
  const userInfo = cookies.userInfo;
  if (!userInfo) return res.status(401).json({ error: 'Not authenticated' });
  try {
    return res.status(200).json({ userInfo: JSON.parse(userInfo) });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid userInfo cookie' });
  }
});

// Logout - clear cookies
app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', [
    serialize('userInfo', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    }),
  ]);
  return res.status(200).json({ message: 'Logged out successfully' });
});

// --- User CRUD endpoints (operate on USERS_TABLE)
// GET /api/user -> return current user's profile (from DynamoDB)
app.get('/api/user', async (req, res) => {
  const cookies = parse(req.headers.cookie || '');
  const userInfo = cookies.userInfo ? JSON.parse(cookies.userInfo) : null;
  if (!userInfo || !userInfo.username) return res.status(401).json({ error: 'Not authenticated' });
  if (!USERS_TABLE) return res.status(500).json({ error: 'Server misconfiguration: USERS_TABLE missing' });

  try {
    const normalizedUsername = userInfo.username.toLowerCase();
    console.log('[DEBUG] GET /api/user - Querying DynamoDB for username:', normalizedUsername);
    console.log('[DEBUG] Table name:', USERS_TABLE);
    const result = await dynamodb.get({ TableName: USERS_TABLE, Key: { id: normalizedUsername } }).promise();
    console.log('[DEBUG] DynamoDB result:', JSON.stringify(result, null, 2));
    if (!result.Item) {
      console.log('[DEBUG] User not found in DynamoDB. Username queried:', userInfo.username);
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ item: result.Item });
  } catch (e) {
    console.error('GET /api/user error:', e);
    return res.status(500).json({ error: 'Failed to read user' });
  }
});

// PUT /api/user -> update current user's profile (name,email)
app.put('/api/user', async (req, res) => {
  const cookies = parse(req.headers.cookie || '');
  const userInfo = cookies.userInfo ? JSON.parse(cookies.userInfo) : null;
  if (!userInfo || !userInfo.username) return res.status(401).json({ error: 'Not authenticated' });
  if (!USERS_TABLE) return res.status(500).json({ error: 'Server misconfiguration: USERS_TABLE missing' });

  const { name, email } = req.body || {};
  if (!name && !email) return res.status(400).json({ error: 'Nothing to update' });

  const updateParts = [];
  const ExpressionAttributeNames = {};
  const ExpressionAttributeValues = {};

  if (name !== undefined) {
    updateParts.push('#n = :n');
    ExpressionAttributeNames['#n'] = 'name';
    ExpressionAttributeValues[':n'] = name;
  }
  if (email !== undefined) {
    updateParts.push('#e = :e');
    ExpressionAttributeNames['#e'] = 'email';
    ExpressionAttributeValues[':e'] = email;
  }

  const UpdateExpression = 'SET ' + updateParts.join(', ');

  try {
    // Normalize username to lowercase for consistent lookup
    const normalizedUsername = userInfo.username.toLowerCase();
    const resp = await dynamodb.update({
      TableName: USERS_TABLE,
      Key: { id: normalizedUsername },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }).promise();
    return res.json({ item: resp.Attributes });
  } catch (e) {
    console.error('PUT /api/user error:', e);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/user -> delete current user's record from DynamoDB (does NOT delete Cognito user)
app.delete('/api/user', async (req, res) => {
  const cookies = parse(req.headers.cookie || '');
  const userInfo = cookies.userInfo ? JSON.parse(cookies.userInfo) : null;
  if (!userInfo || !userInfo.username) return res.status(401).json({ error: 'Not authenticated' });
  if (!USERS_TABLE) return res.status(500).json({ error: 'Server misconfiguration: USERS_TABLE missing' });

  try {
    // Normalize username to lowercase for consistent lookup
    const normalizedUsername = userInfo.username.toLowerCase();
    await dynamodb.delete({ TableName: USERS_TABLE, Key: { id: normalizedUsername } }).promise();
    // clear cookie
    res.setHeader('Set-Cookie', [serialize('userInfo', '', { path: '/', maxAge: 0 })]);
    return res.json({ message: 'User record deleted (Cognito user not deleted).' });
  } catch (e) {
    console.error('DELETE /api/user error:', e);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Contact Us endpoint - Invoke Lambda to trigger Step Functions
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields: name, email, or message' });
  }

  try {
    const lambda = new AWS.Lambda();
    const payload = {
      body: JSON.stringify({ name, email, message })
    };

    const result = await lambda.invoke({
      FunctionName: 'ContactHandler', // Your Lambda function name in AWS
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload)
    }).promise();

    const response = JSON.parse(result.Payload);

    if (response.statusCode === 200) {
      return res.json(JSON.parse(response.body));
    } else {
      return res.status(response.statusCode).json(JSON.parse(response.body));
    }
  } catch (error) {
    console.error('Contact API error:', error);
    return res.status(500).json({ error: 'Failed to send message', detail: error.message });
  }
});

app.listen(PORT, () => console.log(`✅ Express Server is running on http://localhost:${PORT}`));
