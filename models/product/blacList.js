const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const blackListSchema = {
    name: String,
    list: [String]
}


module.exports = mongoose.model('BlackList', blackListSchema)