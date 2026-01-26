
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Product = require('./product');



const subProductSchema = new Schema({
    name: String,
    price: Number,
    quantity: {
        type: Number,
        default: 0
    },
    qty: String,
    recipe: String,
    description: {
        type: String
    },
    sellPriceNoVat: Number,
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie'
    },
    order: {
        type: Number,
    },
    available: {
        type: Boolean,
        default: true
    },
    tva: {
        type: Number
    },
    printOut:{
        type: Boolean,
    },
    invisible:{
        type: Boolean,
        default: false
    },
    stock: {
        active: {
            type: Boolean,
            default: false
        },
        value: {
            type: Number,
            default: 0,
        }
    },
    saleLog: [
        {
            date: {
                type: Date,
                index: true,
            },
            total: Number,
            discount: Number,
            qty: {
                type: Number
            },
            hours: [
                {
                    date: {
                        type: Date,
                        index: true
                    },
                    qty: {
                        type: Number,
                    }
                }
            ]
        }
    ],
    productionCost: Number,
    ings: [
        {
       
          qty: {
            type: Number,
          },
          gestiune: {
            type: Schema.Types.ObjectId,
            ref: 'Gestiune'
          },
          ing: {
            type: Schema.Types.ObjectId,
            ref: "IngredientInv"
          }
    
        },
      ],
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      },
    allergens: [
        {
            name: String
        }
    ],
    additives: [
        {
            name: String
        }
    ],
    nutrition: {
        energy: {
            kJ: {
                type: Number,
                default: 0
            },
            kcal:  {
                type: Number,
                default: 0
            },
        },
        fat: {
            all:  {
                type: Number,
                default: 0
            },
            satAcids: {
                type: Number,
                default: 0
            },
        },
        carbs: {
            all: {
                type: Number,
                default: 0
            },
            sugar: {
                type: Number,
                default: 0
            },
        },
        salts:  {
            type: Number,
            default: 0
        },
        protein:  {
            type: Number,
            default: 0
        },
    },
})

subProductSchema.pre('deleteOne', { document: true }, async function (next) {
    try {
        const subId = this._id
        await Product.updateMany({ subProducts: subId }, { $pull: { subProducts: subId } }).exec()
        next()
    } catch (error) {
        next(error)
    }

})

module.exports = mongoose.model('SubProduct', subProductSchema)


