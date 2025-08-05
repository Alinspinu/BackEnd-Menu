const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const compInvSchema = new Schema({
    date: Date,
    ingredients: [
        {
            name: String,
            um: String,
            first: Number,
            second: Number,
            scripticUnload: String,
            depVal: String,
            dep: String,
            price: Number,
            depVal: Number,
            upload: {
                value: 0,
                entries: []
            }
        }

    ],
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