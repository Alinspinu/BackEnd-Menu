const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clientSchema = new Schema({
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
  vat: {
    type: Boolean,
    default: true
  },
  email: {
    type: String
  },
  telephone: {
    type: String
  },
  bank: {
    type: String,
  },
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
  locatie: {
    type: Schema.Types.ObjectId,
    ref: 'Locatie'
  },
  sold: {
    type: Number,
    default: 0
  },
  records: [
    {
      typeOf: {
        type: String,
        enum: ['intrare', 'iesire']
      },
      document: {
        typeOf: {
          type: String,
        },
        docId: {
          type: String,
        },
        amount: {
          type: Number
        },
        asociat: {
          type: Boolean,
          default: false
        },
        docRecords: [
          { 
            docNumber: String,
            docTotal: Number,
           
          }
        ]
      },
      sold: {
        type: Number
      },
      recipt: {
        type: Schema.Types.ObjectId,
        ref: 'Recipt'
      },
      invoice:{
          type: Schema.Types.ObjectId,
          ref: 'Invoice'
        },
      description: {
        type: String
      },
   
      date: {
        type: Date
      },
      salePoint:{
        type: Schema.Types.ObjectId,
        ref: 'SalePoint'
      } 
    }
  ]

});

module.exports = mongoose.model("CLient", clientSchema);