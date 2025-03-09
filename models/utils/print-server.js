const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const printServerSchema = new Schema({
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
    },
    name: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('PrintServer', printServerSchema);