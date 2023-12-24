const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const prodIngSchema = new Schema({
    name: String,
    um: String,
    qty: Number,
    price: Number,
    ings: [
        {
        name: {
          type: String,
        },
        um: {
          type: String,
        },
        qty: {
          type: Number,
          default: 1
        },
        price: {
          type: Number,
          default: 0
        },
    }
],

  locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
  }
});

module.exports = mongoose.model("ProdIngredientInv", prodIngSchema);