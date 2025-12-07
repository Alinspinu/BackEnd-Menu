const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const compInvSchema = new Schema({
    dateFirst: Date,
    dateSecond: Date,
    ingredients: [
        {
            name: String,
            um: String,
            first: Number,
            second: Number,
            scripticUnload: String,
            saleUnload: Number,
            depVal: Number,
            dep: String,
            firstPrice: Number,
            secondPrice: Number,
            price: Number,
            upload: {
                value: Number,
                entries: [
                    {
                        date: String,
                        qty: Number,
                        operation: {name: String, details: String}
                    }
                ]
            }
        }

    ],
    gestiune: {
        type: Schema.Types.ObjectId,
        ref: 'Gestiune'
    },
    firstInv: {
        type: Schema.Types.ObjectId,
        ref: 'Inventary'
    },
    secondInv: {
        type: Schema.Types.ObjectId,
        ref: 'Inventary'
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


module.exports = mongoose.model("ComparedInventary", compInvSchema);