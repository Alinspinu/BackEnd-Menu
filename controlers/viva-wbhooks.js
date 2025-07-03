
const axios = require('axios');

const Viva = require('../models/office/viva-data')


module.exports.transactionCreated = async (req, res) => {
    console.log(req.body)
    try{
       const data = new Viva({data: req.body})
       const savedData =  await data.save()
       console.log(savedData)
    } catch(error){
        console.log(error)
    }

    res.status(200).json({Key: '9F11E6672096B03EC72519550A131B78765C3E09'})
}




module.exports.getBankAccounts = async (req, res) => {
    try{
        const accounts = await getBankAccounts()
        res.status(200).json({data: accounts})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}



async function getAccessToken() {
    const tokenUrl = 'https://accounts.vivapayments.com/connect/token';
    const basicAuth = Buffer.from(`${process.env.ACCOUNT_TRANSACTION_ID}:${process.env.ACCOUNT_TRANSACTION_SECRET}`).toString('base64');
    const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('scope', 'urn:viva:payments:core:api:banktransfers');
    try {
      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
  
      return response.data.access_token;
    } catch (error) {
      console.error('Error fetching token:', error.response?.data || error.message);
      return null;
    }
  }


  async function getBankAccounts() {
    const apiUrl = 'https://api.vivapayments.com/banktransfers/v1/bankaccounts'
    const token = await getAccessToken();
    if (!token) return;
  
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
        isArchived: true,
        maxResults: 100,
        }
      });
  
      console.log('Bank Accounts:', response.data);
      return response.data
    } catch (error) {
      console.error('Error fetching bank accounts:', error.response?.data || error.message);
    }
  }





    // const url = 'https://www.vivapayments.com/api/messages/config/token'
    // try {
    //     const credentials = Buffer.from(`${process.env.VIVA_MERCHANT_ID}:${process.env.VIVA_APY_KEY}`).toString('base64');
    //     const response = await axios.get(url, {
    //       headers: {
    //         'Authorization': `Basic ${credentials}`
    //       }
    //     });
    //     console.log('Response data:', response.data);
    //     res.status(200).json({message: response.data})
    //   } catch (error) {
    //     console.error('Error fetching token:', error.response ? error.response.data : error.message);
    //     res.status(500).json({message: error})
    //   }
