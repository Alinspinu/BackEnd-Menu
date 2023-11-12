const admin = require('firebase-admin');
const Order = require('../models/order-true')
const Sub = require('../models/sub-product')

const serviceAccount = require('../ZaFbMessKeY.json'); // Replace with the path to your service account key file
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


module.exports.send = async (req, res, next) => {
    const {token} = req.query
    const changeStream = Order.watch();
    console.log('hit the route')
    let id;
    changeStream.on('change', async (change) => {
        console.log(change.fullDocument._id, id)
     // Logs all changes in the collection
     if (
        change.operationType === "insert" &&
        change.fullDocument.status === 'open' &&
        change.fullDocument._id !== id 
    ) {
            id = change.fullDocument._id
            const docToSend = JSON.stringify(change.fullDocument)
            console.log('1 log')
                const message = {
                    notification: {
                      title: 'New Order',
                      body: 'From Some One',
                    },

                    data:{data: docToSend},
                    webpush: {
                        notification: {
                            icon: 'https://res.cloudinary.com/dhetxk68c/image/upload/v1693319361/black-coffee_okh4fc.png'
                        }, 
                        fcm_options: {
                            link: "https://dummypage.com"
                          }
                    },
                    token: token // Replace with the device's FCM token
                  };
                  
                  admin.messaging().send(message)
                    .then((response) => {
                      console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                      console.log('Error sending message:', error);
                    });
                }
        
    });

       

}

