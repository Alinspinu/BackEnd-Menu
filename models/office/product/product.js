
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Category = require('./cat');


const productTrueSchema = new Schema({
    name: {
        type: String,
        index: true 
    },
    image: [
        {
            path: {
                type: String,
                default: 'https://res.cloudinary.com/dhetxk68c/image/upload/v1692369732/True/no_image_dreptunghi_ktwclc.png'
            },
            filename: {
                type: String,
                default: 'no_image_dreptunghi_ktwclc'
            },
        }
    ],
    order: {
        type: Number,
        required: true
    },
    printer: {
        type: String,
        default: 'barista'
    },
    printOut:{
        type: Boolean,
    },
    toppings:[
            {
                name: String,
                price: Number,
                um: String,
                ingPrice: Number,
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
    price: Number,
    recipe: String,
    description: String,
    longDescription: String,
    tva: Number,
    subId: String,
    preOrder: Boolean,
    preOrderPrice: Number,
    paring: [
        {
            type: Schema.Types.ObjectId,
            ref: "Product"
        }
    ],
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
    ingredients: [       
        {
            quantity: {
                type: Number,
                required: true
            },
            ingredient: {
                type: Schema.Types.ObjectId,
                ref: 'Ingredient'
            }
        }
    ],
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
    qty: {
        type: String,
    },
    tva: Number,
    dep: String,
    quantity: {
        type: Number,
        default: 0
    },
    available: {
        type: Boolean,
        default: true
    },
    total: {
        type: Number,
    },
    sgrTax: {
        type: Boolean,
        default: false
    },
    mainCat: String,
    discount: {
        type: Number,
        default: 0
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
                type: Number,
            },
            hours: [
                {
                    date: {
                        type: Date,
                        index: true
                    },
                    label: String,
                    qty: {
                        type: Number,
                    }
                }
            ]
        }
    ],

    category:
    {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    locatie: {
        type: Schema.Types.ObjectId,
        ref: 'Locatie',
        index: true
    },
    subProducts:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'SubProduct'
            }
        ],
    salePoint: {
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
        },
    printSection: {
        type: Schema.Types.ObjectId,
        ref: 'Section'
    }

})

productTrueSchema.pre('deleteOne', { document: true }, async function (next) {
    await Category.updateMany({ product: this._id }, { $pull: { product: this._id } }).exec()
    // await this.updateMany({ paring: this._id }, { $pull: { paring: this._id } }).exec()
    next()
})


module.exports = mongoose.model('Product', productTrueSchema)



