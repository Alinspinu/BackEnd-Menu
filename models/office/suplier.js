const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const suplierSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  vatNumber: {
    type: String,
    required: true,
  },
  register: {
    type: String, 
    required: true
  },
  account: {
    type: String,
  },
  bank: {
    type: String,
  },
  address: {
    type: String,
    required: true
  },
  locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
  },

});

module.exports = mongoose.model("Suplier", suplierSchema);