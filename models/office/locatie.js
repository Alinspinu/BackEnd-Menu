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
      },
      account: {
        type: String,
      },
      bank: {
        type: String,
      },
      anafToken: {
        type: Schema.Types.ObjectId,
        ref: 'AnafToken'
      },
      contabil: {
        email: String,
        departament: {
          type: Schema.Types.ObjectId,
          ref: 'Dep'
        }
      },
      contactName: String,
      email: String,
      telephone: String,
      address: {
        type: String,
        required: true
      },
      invoiceAddress: {
        postalCode: String,
        street: String,
        city: String,
        coutrySubentity: String,
      },
      swift: {
        type: String
      },
      VAT: {
        type: Boolean,
        required: true
      },
      gmail: {
       email: String,
       app: {
        iv: {
          type: String,
        },
        key: {
          type: String
        },
        secret: String,
       }
      },
      pos: {
        vivaWalletLocal: {
          ip: String,
          port: String
        }
      }
    
})



module.exports = mongoose.model('Locatie', locatieSchema)