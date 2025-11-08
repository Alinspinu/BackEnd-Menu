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
  hours: String,
  telephone: String,
  email: String,

  latitude: Number,
  longitude: Number,
  notifications: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      reservation: {
        type: Boolean,
        default: false
      }, 
      checkIn: {
        type: Boolean,
        default: false
      } 
    }
  ]
});

module.exports = mongoose.model('SalePoint', SalePointSchema);