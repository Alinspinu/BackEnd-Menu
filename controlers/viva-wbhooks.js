
const axios = require('axios');
const Viva = require('../models/office/viva-data')
const Suplier = require('../models/office/suplier')
const AWS = require('aws-sdk');


AWS.config.update({ region: 'eu-central-1' }); 
const ssm = new AWS.SSM();



    




module.exports.transactionCreated = async (req, res) => {

    const webHookData = req.body

    try{
    if(
        webHookData.EventData.Description !== 'Sales Clearance Commission Cards' && 
        webHookData.EventData.Description !== 'Sales Clearance Cards' && 
        webHookData.EventData.Description !== 'Viva Cashback'
    ){
        const data = new Viva({data: webHookData})
        const savedData =  await data.save()
    }
    } catch(error){
        console.log(error)
    }

    res.status(200).json({Key: '9F11E6672096B03EC72519550A131B78765C3E09'})
}


module.exports.devWeb = async(req, res) => {
    try{
        let cardPurchase = []
        let ibanTransfer = []
        const data = await Viva.find()
        for(let d of data){
            console.log(d.data.EventData)
            if(d.data.EventData.Description.includes('Viva Wallet Card Purchase')){
                cardPurchase.push(d)
            }
            
        }
        res.status(200).json({card: cardPurchase, iban: ibanTransfer})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}




module.exports.getBankAccounts = async (req, res) => {
    try{
        let skip = 0
        let acc = []

        const accounts = await getBankAccounts(20)

        res.status(200).json({data: accounts})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}






function clean(input) {
    return input.replace(/(SC|SRL|S\.R\.L\.|SRL|S\.R\.L|SA|S\.A\.|S\.C\.|S\.C|\s+)/gi, '');
  }



async function getAccessToken() {
    const id =  await getSecret('/account/id')
    const secret =  await getSecret('/account/secret')
    const tokenUrl = 'https://accounts.vivapayments.com/connect/token';
    const basicAuth = Buffer.from(`${id}:${secret}`).toString('base64');
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


  async function getBankAccounts(skip) {
    const apiUrl = 'https://api.vivapayments.com/banktransfers/v1/bankaccounts'
    const token = await getAccessToken();
    if (!token) return;

    const params = {
        skip: skip,
      };
  
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params
      });
  
      return response.data
    } catch (error) {
      console.error('Error fetching bank accounts:', error.response?.data || error.message);
    }
  }


  async function getSecret(name) {
    const param = await ssm.getParameter({
      Name: name,
      WithDecryption: true
    }).promise();
  
    return param.Parameter.Value;
  }



