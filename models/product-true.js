
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
    price: Number,
    description: String,
    longDescription: String,
    paring: [
        {
            type: Schema.Types.ObjectId,
            ref: "ProductTrue"
        }
    ],
    allergens: [
        {
            name: String
        }
    ],
    nutrition: {
        energy: {
            kJ: Number,
            kcal: Number,
        },
        fat: {
            all: Number,
            satAcids: Number,
        },
        carbs: {
            all: Number,
            sugar: Number,
        },
        salts: Number,
        additives: String,
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
    await this.updateMany({ paring: this._id }, { $pull: { paring: this._id } }).exec()
    next()
})


module.exports = mongoose.model('ProductTrue', productTrueSchema)