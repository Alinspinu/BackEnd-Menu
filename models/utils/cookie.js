const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CookieSchema = new Schema({
    time: Date,
    gender: Boolean,
    ip: String 
});

module.exports = mongoose.model('Cookie', CookieSchema);