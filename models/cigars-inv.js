const mongoose = require('mongoose');   
const Schema = mongoose.Schema;



const cigarsSchema = new Schema({
    date: {
        type: Date
    },
    products: [
        {   
            name: String,
            firts: Number,
            found: Number,
            sale: Number,
            second: Number,
            valid: Boolean,
            ing: {
                type: Schema.Types.ObjectId,
                ref: 'IngredientInv'
            }

        }
    ],
    valid: Boolean,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie',
    },
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
    }
})

module.exports = mongoose.model('CigarsInv', cigarsSchema)