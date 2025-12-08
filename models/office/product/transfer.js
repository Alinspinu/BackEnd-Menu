const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const transferSchema = new Schema({
    date: Date,

    ingrediente: [
        {
            name: String,
            qty: Number,
            price: Number,
            ing: {
                type: Schema.Types.ObjectId,
                ref: 'IngredientInv'
            },
        }
    ],
    user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
    },
    gestiune: {
        send: {
            type: Schema.Types.ObjectId,
            ref: 'Gestiune'
        },
        recive: {
            type: Schema.Types.ObjectId,
            ref: 'Gestiune'
        }
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie',
        index: true
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint',
        index: true
        }
})

module.exports = mongoose.model('Transfer', transferSchema)