
const axios = require('axios');
const Viva = require('../models/office/viva-data')
const Suplier = require('../models/office/suplier')
const Nir = require('../models/office/nir')





module.exports.transactionCreated = async (req, res) => {

    const webHookData = req.body

    const locatie = "655e2e7c5a3d53943c6b7c53"

    console.log(webHookData)

    try{

    const subId = webHookData.EventData.SubTypeId
    if(subId === 101 || subId === 30){
        let transactionType = subId === 100 ? 'card' : 'transfer'
        let iban = subId === 30 ? webHookData.EventData.Iban : ''
        let vivaAccountId = subId === 30 ? webHookData.EventData.BankAccountId : ''
        let date = subId === 100 ? new Date(webHookData.EventData.ValueDate) : new Date (webHookData.EventData.Created)
        const data = new Viva({
            transactionType: transactionType,
            date: date,
            description: webHookData.EventData.Description,
            amount: Math.abs(webHookData.EventData.amount),
            iban: iban,
            vivaAccountId: vivaAccountId,
            transactionId: webHookData.EventData.WalletTransactionId,
            locatie: locatie,
        })
        const savedData =  await data.save()
        const string = subId === 100 ? savedData.description.split('-')[1].trim().split(' ')[0] : savedData.description.split('-')[1].trim()
        const query = subId === 100 ? {name: {$regex: string, $options: 'i'}, locatie: locatie } : {account: {$regex: string, $options: 'i'}, locatie: locatie }
        const suplier = await Suplier.findOne(query)
        if(suplier){
            savedData.asociat = {}
            savedData.asociat.suplier = suplier._id
            const nir = await Nir.findOne({suplier: suplier._id, totalDoc: savedData.amount, locatie: locatie})
            const record = {
                typeof: 'iesire',
                document: {
                    typeOf: transactionType,
                    docId: savedData.transactionId,
                    amount: savedData.amount,
                    asociat: nir ? true : false
                },
                sold: suplier.sold - savedData.amount,
                nir: nir ? [nir._id] : [],
                description: savedData.description,
                date: savedData.date,
                salePoint: nir ? nir.salePoint : null
            }
            suplier.records.push(record)
            suplier.sold = record.sold
            await suplier.save()
            if(nir){
               savedData.asociat.nir = nir._id
               await Nir.findByIdAndUpdate(nir._id, {payd: true})
            }
            await savedData.save()
        }
    } else {
        const viva = new Viva({data: webHookData})
        if(subId !== 83 || subId !== 13) await viva.save()
       
    }
    } catch(error){
        console.log(error)
    }
    res.status(200).json({Key: '9F11E6672096B03EC72519550A131B78765C3E09'})
}


module.exports.getViva = async (req, res) => {
    const {loc} = req.query
    try{
        const vivas = await Viva.find({locatie: loc})
        console.log(vivas)
        res.status(200).json(vivas)
    } catch(error) {
        res.status(500).json(error)
        console.log(error)
    }
}


module.exports.devWeb = async(req, res) => {
    try{
        let cardPurchase = []
        let ibanTransfer = []
        const data = await Viva.find()
        for(let d of data){
            if(d.data.EventData.SubTypeId === 100){
                cardPurchase.push(d)
                console.log(d.data.EventData)
            }
            if(d.data.EventData.SubTypeId === 30){
                ibanTransfer.push(d)
                console.log(d.data.EventData)
            }
            
        }
        // console.log('Card', cardPurchase)
        // console.log('Transfer', ibanTransfer)
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

        // const accounts = await getBankAccounts(20)

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
    // const id =  await getSecret('/account/id')
    // const secret =  await getSecret('/account/secret')
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
    // const token = await getAccessToken();
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


//   async function getSecret(name) {
//     const param = await ssm.getParameter({
//       Name: name,
//       WithDecryption: true
//     }).promise();
  
//     return param.Parameter.Value;
//   }



