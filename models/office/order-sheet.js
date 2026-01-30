const mongoose = require("mongoose");
const Schema = mongoose.Schema;



const orderSheetSchema = new Schema({
        suplier: {
            locatie: {
                type: Schema.Types.ObjectId,
                ref: 'Locatie'
            },
            salePoint: {
                type: Schema.Types.ObjectId,
                ref: 'SalePoint'
            },
        },
        customer: {
            locatie: {
                type: Schema.Types.ObjectId,
                ref: 'Locatie'
            },
            salePoint: {
                type: Schema.Types.ObjectId,
                ref: 'SalePoint'
            },
            user: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        },

        updates: [
            {
                time: Date,
                user: String
            }
        ],
        

        products: [
            {
                name: String,
                quantity: Number,
                status: {
                    sent: {
                        value: Boolean,
                        user: String,
                        quantity: Number,
                    },
                    recived: {
                        value: Boolean,
                        user: String,
                        quantity: Number,
                    },

                },
                details: String,
                identification: {
                    suplier: {
                        product: {
                            type: Schema.Types.ObjectId,
                            ref: 'Product'
                        }
                    },
                    customer: {
                        ing: {
                            type: Schema.Types.ObjectId,
                            ref: 'IngredientInv'
                        }
                    }
                }
            }
        ],
        comment: String,
        createdAt: Date,
        orderDate: Date,

})

module.exports = mongoose.model('OrderSheet', orderSheetSchema)