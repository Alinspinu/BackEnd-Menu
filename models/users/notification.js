const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const notificationSchema = new Schema({
    sender: String,
    user: {
           type: Schema.Types.ObjectId,
           ref: 'User'
       },
    status: [String],
    reciver: String,
    type: {
        name: String,
        data: Schema.Types.Mixed
    },
    eventId: String,
    event: String,
    redirectLink: String,
    message: String,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    }
    
},{timestamps: true})




module.exports = mongoose.model('Notification', notificationSchema)