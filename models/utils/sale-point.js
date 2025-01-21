const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SalePointSchema = new Schema({
  name: {
    type: String,
    index: true,
    required: true
  },  
  address: String,
  locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
},
});

module.exports = mongoose.model('SalePoint', SalePointSchema);