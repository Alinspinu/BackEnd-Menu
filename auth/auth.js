const jwt = require('jsonwebtoken');

const basicAuth = (req, res, next) => {
    // Check for authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="example"');
        return res.status(401).send('Authentication required');
    }

    // Extract the base64 encoded credentials
    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString();
    const [username, password] = decodedCredentials.split(':');

    // Validate the credentials (replace with your own validation logic)
    const validUsername = process.env.API_USER;
    const validPassword = process.env.API_PASSWORD;

    if (username === validUsername && password === validPassword) {
        return next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="example"');
        return res.status(401).send('Invalid credentials');
    }
}


const authApi = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token is missing' });
    }
  
    // Verify the token
    jwt.verify(token, process.env.AUTH_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      console.log(user)
      req.user = user; // Attach user information to the request
      next();
    });
  };



module.exports = { basicAuth, authApi };