

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TokenSchema = new Schema({

    token: String,
    refresh: String,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    } 
},{timestamps: true});

module.exports = mongoose.model('AnafToken', TokenSchema);