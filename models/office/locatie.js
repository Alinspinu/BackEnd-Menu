const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const locatieSchema = new Schema({
    bussinessName: {
        type: String,
        required: true,
      },
      name: {
        type: String, 
        default: "No1"
      },
      vatNumber: {
        type: String,
        required: true,
      },
      register: {
        type: String, 
        rewuired: true
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
      VAT: {
        type: Boolean,
        required: true
      }
})



module.exports = mongoose.model('Locatie', locatieSchema)