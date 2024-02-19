const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const notificationSchema = new Schema({
    reciver: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    sender: [
        {
           type: Schema.Types.ObjectId,
           ref: 'User'
       },
    ],
    status: {
        type: String,
        enum: ['seen', 'unseen', 'new'],
        default: 'new'
    },
    eventId: String,
    event: String,
    redirectLink: String,
    message: String,
    
},{timestamps: true})




module.exports = mongoose.model('Notification', notificationSchema)