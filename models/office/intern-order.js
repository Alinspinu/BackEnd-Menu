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
            productClient: {
                type: Schema.Types.ObjectId,
                ref: 'Product'
            },
            ingredientClient: {
                type: Schema.Types.ObjectId,
                ref: 'IngredientInv'
            },
            productSuplier: {
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

    client: {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        locatie: {
           type: Schema.Types.ObjectId,
           ref: 'Locatie'
        },
        salePoint:{
            type: Schema.Types.ObjectId,
            ref: 'SalePoint'
        },

        recived: {
            status: Boolean,
            details: String,
        },

    },
    
    suplier: {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        locatie: {
           type: Schema.Types.ObjectId,
           ref: 'Locatie'
        },
        salePoint:{
            type: Schema.Types.ObjectId,
            ref: 'SalePoint'
        },
        deliverd: {
            status: Boolean,
            details: String,

        }
    }


});


module.exports = mongoose.model("InterOrder", interOrderSchema);