const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const blackListSchema = {
    list: [String],
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      }
}


module.exports = mongoose.model('BlackList', blackListSchema)