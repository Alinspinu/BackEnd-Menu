const mongoose = require('mongoose')
const Schema = mongoose.Schema;



const subscriptionSchema = new Schema({

    userId: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: 'User', 
         required: true 
        },
    subscription: { 
        type: Object, 
        required: true 
    },
}, {timestamps: true})


module.exports = mongoose.model('Subscription', subscriptionSchema)