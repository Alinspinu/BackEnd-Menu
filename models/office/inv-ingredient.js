const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Product = require('../office/product/product')
const SubProduct = require('../office/product/sub-product');


const invIngSchema = new Schema({
  name: {
    type: String,
    required: true,
    index: true,
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
      date: {
        type: Date,
        index: true
      },
      qty:  {
        type: Number,
        required: true
      },
      uploadPrice: {
        type: Number,
        default: 0,
      },
      operation: {
        name: {
          type: String,
        },
        details: String,
      },
      logId: {
        type: String,
        index: true
      },
      invoiceName: String,
    }
  ],
  unloadLog: [
    {
      date: {
        type: Date,
        index: true
      },
      qty: Number,
      operation: {
        name: {
          type: String,
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
      day: {
        type: Date,
        index: true
      },
      qty: Number,
      faptic: {
        type: Number,
        default: 0
      },
      gestiune: {
        type: Schema.Types.ObjectId,
        ref: 'Gestiune'
      },
      gName: String,
      
    }
  ],
  eFactura: [
    {
      suplier: String,
      name: String,
      qtyCorector: Number,
      gestiune: {
        type: Schema.Types.ObjectId,
        ref: 'Gestiune'
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
  gestiune: String,
  invGestiune: [
    {
      qty: Number,
      gestiune: {
        type: Schema.Types.ObjectId,
        ref: 'Gestiune'
      },
      name: String,
      entries: [
        {
          qty: Number,
          date: {
            type: Date,
            index: true
          },
          priceNoVat: {
            type: Number,
            required: true
          },
          priceWithVat: {
            type: Number,
            required: true
          },
          inQty: Number,
          suplierName: String,
          nir: {
            type: Schema.Types.ObjectId,
            ref: 'Nir'
          }
        }
      ], 
    }

  ],
  gest: {
    type: Schema.Types.ObjectId,
    ref: 'Gestiune'
  
  },
  recipe: String,
  dep: String,
  dept: {
    type: Schema.Types.ObjectId,
    ref: 'Dep'
  },
  productIngredient: {
    type: Boolean, 
    default: false,
  },
  production: {
    tehnic: {
      type: Boolean,
      default: false
    },
    qty: {
      type: Number,
      default: 0
    }
  },
  ings: [
    {
      qty: Number,
      gestiune: {
        type: Schema.Types.ObjectId,
        ref: 'Gestiune'
      },
      ing: {
        type: Schema.Types.ObjectId,
        ref: 'IngredientInv'
      }
    }
  ],
  locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie',
    index: true
  },
  salePoint: {
    type: Schema.Types.ObjectId,
    ref: 'SalePoint'
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



