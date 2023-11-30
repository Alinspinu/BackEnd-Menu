const admin = require('firebase-admin');
const Order = require('../models/product/order-true')
const Sub = require('../models/product/sub-product')
const serviceAccount = require('../ZapKyyos.json'); // Replace with the path to your service account key file


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


async function sendMessage(token, doc, name){
  const message = {
    notification: {
      title: 'Comandă nouă',
      body: `De la ${name}`,
    },

    data:{data: doc},
    webpush: {
        notification: {
            icon: 'https://res.cloudinary.com/dhetxk68c/image/upload/v1693319361/black-coffee_okh4fc.png'
        }, 
        fcm_options: {
            link: "https://true-meniu.web.app/tabs/orders"
          }
    },
    token: token 
  };
  try{
    const res = await admin.messaging().send(message)
    console.log('Message sent!', res)
  } catch(err){
    console.log(err)
  }
}

const subscribers = [];

function subscribeDevice(token) {
  if (!subscribers.includes(token)) {
    subscribers.push(token);
  }
}

let changeStream = null

module.exports.send = async (req, res, next) => {
  try{
    const {token} = req.query
    subscribeDevice(token)
    console.log(subscribers.length)
    console.log('hit the message route')
    if(changeStream){
      console.log('Have a open Stream')
      changeStream.close()
      console.log('close The stream')
    }
    changeStream = Order.watch({ fullDocument: "updateLookup" });
    changeStream.on('change', async (change) => {
    console.log('Stream was reopend')
     if (
        change.fullDocument &&
        change.operationType === "insert" &&
        change.fullDocument.status === 'open'
    ) {
      const userName = change.fullDocument.userName
      const docToSend = JSON.stringify(change.fullDocument)
      console.log('after docs')
      sendMessage(token, docToSend, userName)
    }   
  });
  res.status(200).json({message: "all good in the hood"})
  }catch(error){
    console.log(error)
    res.status(500).json({message: error})
  }
}

 