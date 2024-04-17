const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Product = require('../office/product/product')
const SubProduct = require('../office/product/sub-product')

const invIngSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  um: {
    type: String,
  },
  qty: {
    type: Number,
    default: 0
  },
  uploadLog: [
    {
      date: String,
      qty: Number,
      operation: {
        name: {
          type: String,
          enum: ['intrare', 'transfer', 'intoarcere']
        },
        details: String,
      }
    }
  ],
  unloadLog: [
    {
      date: String,
      qty: Number,
      operation: {
        name: {
          type: String,
          enum: ['vanzare', 'transfer', 'intoarcere']
        },
        details: String,
      }
    }
  ],
  inventary: [
    {
      index: {
        type: Number,
        index: true
      },
      day: String,
      qty: Number,
      faptic: {
        type: Number,
        default: 0
      }
      
    }
  ],
  price: {
    type: Number,
    default: 0
  },
  sellPrice: {
    type: Number,
    default: 0
  },
  tva: {
    type: Number,
    default: 0,
  },
  tvaPrice: {
    type: Number,
    default: 0
  },
  gestiune: {
    type: String,
    default: 'magazie'
  },
  dep: {
    type: String,
  },
  productIngredient: {
    type: Boolean, 
    default: false
  },
  ings: [
    {
      qty: Number,
      ing: {
        type: Schema.Types.ObjectId,
        ref: 'IngredientInv'
      }
    }
  ],
  locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
  }
});

invIngSchema.pre('deleteOne', { document: true }, async function (next) {
  await this.constructor.updateMany({ 'ings.ing': this._id }, { $pull: { ings: {ing: this._id} } }).exec()
  await Product.updateMany({ 'ings.ing': this._id }, { $pull: { ings: {ing: this._id} } }).exec()
  await Product.updateMany({ 'toppings.ing': this._id }, { $pull: { toppings: {ing: this._id} } }).exec()
  await SubProduct.updateMany({ 'ings.ing': this._id }, { $pull: { ings: {ing: this._id} } }).exec()
  next()
})




module.exports = mongoose.model("IngredientInv", invIngSchema);