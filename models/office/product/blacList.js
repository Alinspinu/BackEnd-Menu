const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const blackListSchema = {
    list: [String],
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
}


module.exports = mongoose.model('BlackList', blackListSchema)