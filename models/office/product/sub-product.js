
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
    description: {
        type: String
    },
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
    ings: [
        {
       
          qty: {
            type: Number,
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
    }
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


