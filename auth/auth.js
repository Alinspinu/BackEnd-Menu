

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


module.exports = { basicAuth };