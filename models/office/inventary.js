const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const inventarySchema = new Schema({
    date: Date,
    gestiune: {
        type: Schema.Types.ObjectId,
        ref: 'Gestiune'
    },
    ingredients: [
        {
            ing: {
                type: Schema.Types.ObjectId,
                ref: 'IngredientInv'
            },
            name: String,
            faptic: Number,
            scriptic: Number,
            gestiune: String,
            dep: String,
            um: String,
            lastPrice: Number,
            averagePrice: Number,
        }
    ],
    fapticValue: {
        type: Number,
        default: 0
    },
    scripticValue: Number,
    updated: Boolean,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      }
})


module.exports = mongoose.model("Inventary", inventarySchema);