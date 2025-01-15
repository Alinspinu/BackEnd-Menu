const mongoose = require('mongoose')
const Schema = mongoose.Schema;



const voucherSchema = new Schema({
    value: {
        type: Number,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['valid', 'invalid'],
        default: 'valid',
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



module.exports = mongoose.model('Voucher', voucherSchema)