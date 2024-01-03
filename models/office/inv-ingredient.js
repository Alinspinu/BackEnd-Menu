const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const invIngSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  um: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    default: 0
  },
  price: {
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
  // await this.updateMany({ paring: this._id }, { $pull: { paring: this._id } }).exec()
  next()
})


module.exports = mongoose.model("IngredientInv", invIngSchema);