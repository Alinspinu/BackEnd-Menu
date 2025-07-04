
const axios = require('axios');

const Viva = require('../models/office/viva-data')

const Suplier = require('../models/office/suplier')


module.exports.transactionCreated = async (req, res) => {

    const webHookData = req.body

    try{
    if(webHookData.EventData.Description !== 'Sales Clearance Commission Cards' || webHookData.EventData.Description !== 'Sales Clearance Cards'){
        const data = new Viva({data: webHookData})
        const savedData =  await data.save()
        console.log(savedData)
    }
    } catch(error){
        console.log(error)
    }

    res.status(200).json({Key: '9F11E6672096B03EC72519550A131B78765C3E09'})
}


module.exports.devWeb = async(req, res) => {
    try{
        let dd = []
        const data = await Viva.find()
        for(let d of data){
            if(d.data.EventData.Description !== 'Sales Clearance Commission Cards' || d.data.EventData.Description !== 'Sales Clearance Cards'){
                console.log(d)
                dd.push(d)
            }
        }
        res.status(200).json(dd)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}




module.exports.getBankAccounts = async (req, res) => {
    try{
        let skip = 0
        let acc = []

        // while (skip < 121){
        //     const accounts = await getBankAccounts(skip)
        //     if(!accounts){
        //         console.log('HIT BRAKE')
        //         break
        //     } else {
        //         acc = [...acc, ...accounts]
        //     }
        //     skip +=20
        // }
        // const supliers = await Suplier.find()
        // for(let ac of acc){
        //     for(let s of supliers) {
        //         if(clean(s.name) === clean(ac.beneficiaryName)){
        //             s.account = ac.iban
        //             s.vivaAccountId = ac.bankAccountId
        //             const ss = await s.save()
        //             console.log('Furnizor actualizat ' ,ss.name, 'IBAN', ss.account, 'VIVA ID', ss.vivaAccountId)
        //         }
        //     }
        // }

        res.status(200).json({data: acc})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}






function clean(input) {
    return input.replace(/(SC|SRL|S\.R\.L\.|SRL|S\.R\.L|SA|S\.A\.|S\.C\.|S\.C|\s+)/gi, '');
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
