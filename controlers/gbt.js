
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const OpenAI = require('openai');
const { sendInfoAdminEmail } = require("../utils/mail");

const Cookie = require('../models/utils/cookie')

  const openai = new OpenAI({
    apiKey: process.env.GBT_APY_KEY
  });
  



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


module.exports.getNutritionalValues = async (req, res) => {
  try{
    const {request} = req.body
    const response = await generateNutritionResponse(request)
    res.status(200).json({message: response})
} catch(err){
    console.log(err)
    res.status(500).json(err)
}
}




module.exports.image = async(req, res, next) => {
  try{
    const {prompt, size = '1792x1024'} = req.body
    const imageUrl = await generateImage(prompt, size)
    res.status(200).json({imageUrl: imageUrl})
  } catch(error){
    console.log(error)
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



async function generateImage(prompt, size) {
  try {
    const response = await openai.images.generate({
      model:"dall-e-3",
      prompt: prompt,
      n: 1, 
      size: size, 
      quality:"hd"
    });
    
    console.log('Generated Image URL:', response.data[0].url);
    return response.data[0].url;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}



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


async function generateNutritionResponse(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [
        { role: 'user',
         content: prompt,
         },
         {
         role: 'system',
         content: 
         `You are a nutrition assistant. 
          When given a list of ingredients 
          with their quantities, respond 
          only with the total nutritional 
          values per 100g of the final product in the following JSON format:
          {
            \"nutrition\": {
              \"energy\": {
                \"kJ\": 0,
                \"kcal\": 0
              },
              \"fat\": {
                \"all\": 0,
                \"satAcids\": 0
              },
              \"carbs\": {
                \"all\": 0,
                \"sugar\": 0
              },
              \"salts\": 0,
              \"protein\": 0
            },
            \"allergens\": [\"Lista alergenilor trebuie să fie scrisă în limba română.\"]
          }
            Please ensure you rely only on the correct nutritional values for each ingredient and always output them in the same way.`
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


module.exports.horoscop = async (messageData) => {
  const prompt = `Zi-mi hoscopul pentru astăzi ${new Date()}. sunt un ${messageData.gender} de ${messageData.age} de ani pe nume ${messageData.name} nascut in zodia ${messageData.zodie} pe data de ${messageData.birth} in 300 de cuvinte`
  const system = `Ești un astrog glumet. Este vorba de spre ${messageData.gender} de ${messageData.age} de ani pe nume ${messageData.name}, este in zodia ${messageData.zodie} și are functia de ${messageData.position} într-o cafenea.`
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [
        { role: 'user',
         content: prompt,
         },
         {
         role: 'system',
         content: system
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

module.exports.generateMood = async (messageData) => {
  const prompt = `${messageData.status}. in maxim 100 de cuvinte`
  const system = `Ești un terapeut glumet. Este vorba de spre ${messageData.gender} de ${messageData.age} de ani pe nume ${messageData.name}, este in zodia ${messageData.zodie} și are functia de ${messageData.position} într-o cafenea restaurant. Nu mentiona varsta, zodia sau functia.`
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [
        { role: 'user',
         content: prompt,
         },
         {
         role: 'system',
         content: system
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