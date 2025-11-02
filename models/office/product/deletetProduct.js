const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const deletetProductSchema = new Schema ({
        locatie: {
            type: Schema.Types.ObjectId,
            ref: 'Locatie'
        },
        employee:{
          name:  {
            type: String,
            },
            position: {
                type: String,
            }
        },
        inv: {
            type: String,
            required: true,
            enum: ['in', 'out']
    },
        reason: String,
        admin: String,
        billProduct: {
            name: {
                type: String,
                required: true
            },
            category: String,
            printer: {
                type: String, 
                default: 'main'
            },
            sentToPrint: {
                type: Boolean,
                default: true
            },
            imgUrl: {
                type: String,
                default: 'https://res.cloudinary.com/dhetxk68c/image/upload/v1692369756/True/no_image_patrat_pt8iod.png'
            },
            mainCat: String,
            payToGo: Boolean,
            sub: Boolean,
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            total: {
                type: String,
                required: true
            },
            toppings: [
                {
                    name: String,
                    price: Number,
                    qty: Number,
                    um: String,
                    ingPrice: Number,
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
            ings: [
                {
                    ing: {
                        type: Schema.Types.ObjectId,
                        ref: 'IngredientInv'
                    },
                    gestiune: {
                        type: Schema.Types.ObjectId,
                        ref: 'Gestiune'
                    },
                    qty: {
                      type: Number,
                    }
                  },
            ]
        },
        salePoint: {
            type: Schema.Types.ObjectId,
            ref: 'SalePoint'
          }
}, { timestamps: true, })

module.exports = mongoose.model('DeletetProduct', deletetProductSchema)