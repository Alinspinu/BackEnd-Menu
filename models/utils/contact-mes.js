const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactMessageSchema = new Schema({
    name: String,
    email: String,
    message: String,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    } 
});

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);