const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const tokenSchema = new Schema({
    service: {
        type: String,
        requred: true
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true, })


module.exports = mongoose.model("Token", tokenSchema);