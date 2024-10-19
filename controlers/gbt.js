
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const OpenAI = require('openai');
const { sendInfoAdminEmail } = require("../utils/mail");

const Cookie = require('../models/utils/cookie')

  const openai = new OpenAI({
    apiKey: process.env.GBT_APY_KEY
  });
  
  async function generateResponse(prompt) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', 
        messages: [
          { role: 'user',
           content: prompt,
           },
           {
           role: 'system',
           content: `Ești un terapeut drăguț care vrea să ajute oamenii să-si depasească condiția. Verifică și corectează textul de greseli gramaticale și de exprimare înaite de a-l trimite.`
           } 
          ],
        temperature: 0.8,
        top_p: 1
      });
      return response.choices[0].message.content
    } catch (error) {
      console.error('Error generating response:', error);
      throw(error)
    }
  }


module.exports.getMessage = async (req, res, next) => {
    try{
        const {request, data} = req.body
        const response = await generateResponse(request)

        const dataa = {
          name: 'Mood On', 
          prompt: `Este  ${data.gender}. Se simte: ${data.emotions}. Pentru ca: ${data.reason}. Isi doreste: ${data.purpose}. <br><br><br>`,
          action: response
        }
        const adminEmail = 'alinz.spinu@gmail.com'
        const gmail = {
          email: 'cafetish.office@gmail.com',
          app: {
            iv: process.env.CAFETISH_IV,
            key: process.env.CAFETISH_KEY,
            secret: process.env.CAFETISH_SECRET + '=' 
          }
        }
        sendInfoAdminEmail(dataa, adminEmail, gmail)
        res.status(200).json({message: response})
    } catch(err){
        console.log(err)
        res.status(500).json(err)
    }
}


module.exports.saveCookie = async (req, res) => {

  try{
    const {cookie} = req.body
    const newCookie = new Cookie(cookie)
    await newCookie.save()
    res.status(200).json({message: 'cookie saved'})
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }

}


module.exports.getCookie = async (req, res) => {
  try{

    const {ip} = req.query
    const date = new Date(Date.now())
    const cookie = await Cookie.findOne({ip: ip, time: {$gt: date}})
    if(cookie){
      res.status(200).json({message: 'cookie', cookie: cookie})
    } else {
      res.status(200).json({message: 'cookie', cookie: null})
    }
 
  } catch(err){
    console.log(err)
    res.status(500).json(err)
  }
}