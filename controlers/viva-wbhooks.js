
const axios = require('axios');


module.exports.transactionCreated = async (req, res) => {
    console.log(req.body)

    const url = 'https://www.vivapayments.com/api/messages/config/token'
    try {
        const credentials = Buffer.from(`${process.env.VIVA_MERCHANT_ID}:${process.env.VIVA.APY_KEY}`).toString('base64');
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        });
        console.log('Response data:', response.data);
        res.status(200).json({message: response.data})
      } catch (error) {
        console.error('Error fetching token:', error.response ? error.response.data : error.message);
        res.status(500).json({message: error})
      }


    // res.status(200).json({message: 'Request recived'})


}