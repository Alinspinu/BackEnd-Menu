const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const depSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
        }
})



module.exports = mongoose.model('Dep', depSchema)