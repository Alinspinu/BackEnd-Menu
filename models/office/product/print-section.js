const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const sectionSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    }
})


module.exports = mongoose.model('Section', sectionSchema)