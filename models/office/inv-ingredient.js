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
  locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
  }
});

module.exports = mongoose.model("IngredientInv", invIngSchema);