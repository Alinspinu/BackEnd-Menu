
const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const Category = require('./cat-true');


const productTrueSchema = new Schema({
    name: String,
    image:
    {
        path: {
            type: String,
            default: 'https://res.cloudinary.com/dhetxk68c/image/upload/v1692369732/True/no_image_dreptunghi_ktwclc.png'
        },
        filename: {
            type: String,
            default: 'no_image_dreptunghi_ktwclc'
        },
    },
    order: {
        type: Number,
        required: true
    },
    toppings:[
            {
                name: String,
                price: Number,
                qty: Number,
                um: String,
                ingPrice: Number,
            }
    ],
    price: Number,
    description: String,
    longDescription: String,
    tva: Number,
    dep: String,
    paring: [
        {
            type: Schema.Types.ObjectId,
            ref: "ProductTrue"
        }
    ],
    ings: [
        {
          name: {
            type: String,
          },
          qty: {
            type: Number,
          },
          price: {
            type: Number,
          },
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
    mainCat: String,
    category:
    {
        type: Schema.Types.ObjectId,
        ref: 'CategoryTrue'
    },
    subProducts:
        [
            {
                type: Schema.Types.ObjectId,
                ref: 'SubProduct'
            }
        ]

})

productTrueSchema.pre('deleteOne', { document: true }, async function (next) {
    await Category.updateMany({ product: this._id }, { $pull: { product: this._id } }).exec()
    // await this.updateMany({ paring: this._id }, { $pull: { paring: this._id } }).exec()
    next()
})


module.exports = mongoose.model('ProductTrue', productTrueSchema)