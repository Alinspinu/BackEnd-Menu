if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const Token = require('../../models/office/token')
const axios = require('axios');
const querystring = require('querystring');

module.exports.getToken = async (req, res) => {
    try{
        const authUrl = `${process.env.ANAF_AUTH_URL}?response_type=code&client_id=${process.env.ANAF_CLIENT_ID}&redirect_uri=${process.env.ANAF_REDIRECT_URI}`;
        console.log(authUrl)
        res.redirect(authUrl);

    } catch(error){
        console.log(error)
    }
}



module.exports.getTokenCallBack = async (req, res) => {
    const code = req.query.code;
    console.log(req.query)
    if (!code) {
        console.log('no-code')
        return res.status(400).send('Authorization code not found');
    }

    try {
        const response = await axios.post(
            process.env.ANAF_TOKEN_URL,
            querystring.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.ANAF_REDIRECT_URI,
                client_id: process.env.ANAF_CLIENT_ID,
                client_secret: process.env.ANAF_CLIENT_SECRET,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                auth: {
                    username: process.env.ANAF_CLIENT_ID,
                    password: process.env.ANAF_CLIENT_SECRET,
                },
            }
        );

        const accessToken = response.data.access_token;
        const expiresIn = response.data.expires_in; // If available, to calculate expiration time

        // Save the token to MongoDB
        const tokenDocument = new Token({
            service: 'e-factura',
            token: accessToken,
            expiresAt: new Date(Date.now() + expiresIn * 1000) // Optional: Save expiration time
        });
        console.log(response)
        console.log(tokenDocument)
        // await tokenDocument.save();

        res.status(200).json({message: 'token recived'})
    } catch (error) {
        console.error('Error retrieving access token:', error);
        res.status(500).send('Failed to retrieve access token');
    }
}
