const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const interOrderSchema = new Schema({
    date: {
        type: Date, 
        index: true
    },
    products: [
        {   
            name: String,
            qty: Number,
            productSender: {
                type: Schema.Types.ObjectId,
                ref: 'Product'
            },
            ingredientSender: {
                type: Schema.Types.ObjectId,
                ref: 'IngredientInv'
            },
            productReciver: {
                type: Schema.Types.ObjectId,
                ref: 'Product'
            },
            checked: {
                recived: {
                    type: Boolean,
                    default: false
                },
                reason: String,
                delivered:{
                    type: Boolean,
                    default: false
                },
                user: {
                    name: String,
                    user: {
                        type: Schema.Types.ObjectId,
                        ref: 'User'
                    }
                }
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


module.exports = mongoose.model("InterOrder", interOrderSchema);