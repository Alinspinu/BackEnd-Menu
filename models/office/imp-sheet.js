const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Ingredient = require('./inv-ingredient')



const imparimentSheetSchema = new Schema({
    date: {
        type: Date, 
        index: true
    },
    ings: [
        {   
            qty: Number,
            gestiune: {
                type: Schema.Types.ObjectId,
                ref: 'Gestiune'
            },
            ing: {
                type: Schema.Types.ObjectId,
                ref: "IngredientInv"
            }
        }
    ],
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      }
});


module.exports = mongoose.model("ImpSheet", imparimentSheetSchema);